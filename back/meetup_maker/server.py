from asyncio import Future, run
from dacite import from_dict
from dataclasses import dataclass
from datetime import datetime
from logging import getLogger
from json import loads
from pathlib import Path
from pprint import pformat
from typing import Union

from meetup_maker.api import (
    ClientRequest,
    ClientSignup,
    ServerResponse,
    ServerSignup,
    User,
    Message,
    make_uuid4,
)
from meetup_maker.configuration import Configuration, load_configuration, setup_logging
from meetup_maker.database import (
    add_user,
    connect_db,
    create_tables,
    credentials_valid,
    kdf,
    user_exists,
)
from websockets.server import WebSocketServerProtocol, serve

logger = getLogger("meetup-maker")

g_config: Configuration
g_sessions: dict[str, datetime]


def signup(user: User) -> bool:
    c = connect_db(g_config.database.path)
    if user_exists(c, user.email):
        return False

    return add_user(c, user)


def login(email: str, password: str) -> bool:
    c = connect_db(g_config.database.path)
    if not user_exists(c, email):
        return False

    if not credentials_valid(c, email, password):
        return False

    return True


def validate_token(token: str) -> bool:
    if token not in g_sessions.keys():
        return False

    now = datetime.now()
    if (now - g_sessions[token]).total_seconds() > g_config.server.session_length:
        g_sessions.pop(token)
        return False

    g_sessions[token] = now
    return True


def heartbeat(token: str) -> bool:
    return validate_token(token)


def _handle_signup(m: ClientSignup) -> Union[ServerSignup, ServerResponse]:
    u = User(m.first_name, m.last_name, m.email, m.kdf)
    result = signup(u)
    if not result:
        return ServerResponse(m.type, reason="Could not sign up user")

    token = make_uuid4()
    g_sessions[token] = datetime.now()
    return ServerSignup(token=token)


async def _server(ws: WebSocketServerProtocol):
    async for message in ws:
        if not isinstance(message, str):
            if not isinstance(message, bytes):
                return ServerResponse(Message.INVALID, reason="Invalid websocket input")
            else:
                message = message.decode()

        try:
            d = loads(message)
            d["message"] = Message(d["message"])
            if d["message"] == Message.SIGNUP:
                await ws.send(_handle_signup(ClientSignup.cast(d)).serialize())
        except KeyError:
            return ServerResponse(Message.INVALID, reason="Invalid message type")
        except Exception:
            return ServerResponse(Message.INVALID, reason="Exception")


async def server():
    logger.info("Standing up websocket server")
    async with serve(_server, "localhost", 8765):
        await Future()


def main():
    setup_logging(logger)

    global g_config
    g_config = load_configuration(Path("~/.cache/meetup-maker/config.yml").expanduser())
    logger.info(f"Using configuration:\n{pformat(g_config.dict())}")

    global g_sessions
    g_sessions = {}

    logger.info("Connecting to database file")
    c = connect_db(g_config.database.path)
    create_tables(c)
    c.close()

    try:
        run(server())
    except KeyboardInterrupt:
        pass
    logger.info("Shutting down websocket server")


if __name__ == "__main__":
    main()
