from asyncio import Future, run
from datetime import datetime
from logging import getLogger
from json import loads
from pathlib import Path
from pprint import pformat
from typing import Optional, Union
from ssl import PROTOCOL_TLS_SERVER, SSLContext

from meetup_maker.api import (
    ClientSignup,
    ClientLogin,
    ClientToken,
    ServerLogin,
    ServerResponse,
    ServerSignup,
    Message,
    ServerToken,
    User,
    make_uuid4,
)
from meetup_maker.configuration import Configuration, load_configuration, setup_logging
from meetup_maker.database import (
    add_user,
    connect_db,
    create_tables,
    credentials_valid,
    get_user,
    user_exists,
)
from websockets.server import WebSocketServerProtocol, serve

logger = getLogger("meetup-maker")

g_config: Configuration
g_sessions: dict[str, datetime]


def signup(signup: ClientSignup) -> bool:
    c = connect_db(g_config.database.path)
    if user_exists(c, signup.email):
        logger.info(f"User {signup.email} already exists.")
        return False

    result = add_user(c, signup)
    if result:
        logger.info(f"Added user {signup.email}")
    else:
        logger.info(f"Failed to add user {signup.email}")
    return result


def login(email: str, password: str) -> Optional[User]:
    c = connect_db(g_config.database.path)
    if not user_exists(c, email):
        return None

    if not credentials_valid(c, email, password):
        return None

    return get_user(c, email)


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


def _handle_signup(m: ClientSignup, token: str) -> Union[ServerSignup, ServerResponse]:
    if len(m.first_name) == 0:
        return ServerResponse(m.uuid, m.type, reason="No first name provided")
    if len(m.last_name) == 0:
        return ServerResponse(m.uuid, m.type, reason="No last name provided")
    if len(m.email) == 0:
        return ServerResponse(m.uuid, m.type, reason="No email provided")
    if len(m.password) == 0:
        return ServerResponse(m.uuid, m.type, reason="No password provided")

    result = signup(m)
    if not result:
        return ServerResponse(m.uuid, m.type, reason="Could not sign up user")

    return ServerSignup(m.uuid, token=token)


def _handle_login(m: ClientLogin, token: str) -> Union[ServerLogin, ServerResponse]:
    if len(m.email) == 0:
        return ServerResponse(m.uuid, m.type, reason="No email provided")
    if len(m.password) == 0:
        return ServerResponse(m.uuid, m.type, reason="No password provided")

    result = login(m.email, m.password)
    if not result:
        return ServerResponse(m.uuid, m.type, reason="Invalid credentials")

    return ServerLogin(m.uuid, token=token, first_name=result.first_name)


async def _server(ws: WebSocketServerProtocol):  # noqa: C901
    logger.info("Client connected")
    token = make_uuid4()
    async for message in ws:
        logger.info(f"New message - {message}")
        if not isinstance(message, str):
            if not isinstance(message, bytes):
                return ServerResponse(
                    "", Message.INVALID, reason="Invalid websocket input"
                )
            else:
                message = message.decode()

        uuid = ""
        try:
            d = loads(message)
            if "uuid" in d.keys():
                uuid = d["uuid"]
            d["type"] = Message(d["type"])
            if d["type"] == Message.SIGNUP:
                await ws.send(_handle_signup(ClientSignup.cast(d), token).serialize())
            elif d["type"] == Message.LOGIN:
                await ws.send(_handle_login(ClientLogin.cast(d), token).serialize())
            elif d["type"] == Message.TOKEN:
                m = ClientToken.cast(d)
                c = connect_db(g_config.database.path)
                u = get_user(c, m.email)
                if validate_token(m.token):
                    token = m.token
                    await ws.send(
                        ServerToken(
                            m.uuid, first_name=u.first_name if u else ""
                        ).serialize()
                    )
                else:
                    await ws.send(
                        ServerResponse(
                            m.uuid, m.type, reason="Expired or invalid token"
                        ).serialize()
                    )
            else:
                await ws.send(
                    ServerResponse(
                        uuid, d["type"], reason="Not implemented yet"
                    ).serialize()
                )
        except KeyError as e:
            logger.exception(f"KeyError - {e}")
            await ws.send(
                ServerResponse(
                    uuid, Message.INVALID, reason="Invalid message type"
                ).serialize()
            )
        except Exception as e:
            logger.exception(f"Other exception - {e}")
            await ws.send(
                ServerResponse(uuid, Message.INVALID, reason="Exception").serialize()
            )
    logger.info("Client disconnected")
    if token:
        g_sessions[token] = datetime.now()


def make_context() -> SSLContext:
    p_cert = Path(g_config.server.cert).expanduser()
    if not p_cert.exists():
        logger.exception(f"Certificate {p_cert} does not exist")
        exit(1)
    if p_cert.is_dir():
        logger.exception(f"Certificate {p_cert} is a directory, not a file")
        exit(1)

    p_key = Path(g_config.server.cert_key).expanduser()
    if not p_key.exists():
        logger.exception(f"Certificate key {p_key} does not exist")
        exit(1)
    if p_key.is_dir():
        logger.exception(f"Certificate key {p_key} is a directory, not a file")
        exit(1)

    context = SSLContext(PROTOCOL_TLS_SERVER)
    context.load_cert_chain(p_cert, p_key)
    return context


async def server():
    logger.info("Standing up websocket server")
    async with serve(_server, "localhost", 8765, ssl=make_context()):
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
