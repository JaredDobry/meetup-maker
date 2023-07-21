from dataclasses import asdict, dataclass, field
from enum import IntEnum
from json import dumps
from typing import Optional, Self
from uuid import uuid4

from dacite import from_dict


@dataclass
class User:
    first_name: str
    last_name: str
    email: str
    kdf: str


@dataclass
class Event:
    name: str
    owner: int
    invite_code: str


@dataclass
class Participant:
    event_id: int
    user_id: int


class Message(IntEnum):
    INVALID = -1
    SIGNUP = 0
    LOGIN = 1
    TOKEN = 2
    HEARTBEAT = 3
    CREATE_EVENT = 4


def make_uuid4() -> str:
    return str(uuid4())


@dataclass
class ClientRequest:
    type: Message
    uuid: str = field(default_factory=make_uuid4)


@dataclass
class ServerResponse:
    type: Message
    ok: bool = False
    reason: Optional[str] = None

    def serialize(self) -> str:
        return dumps(asdict(self))


@dataclass
class ClientSignup(ClientRequest):
    first_name: str = "John"
    last_name: str = "Doe"
    email: str = "johndoe@example.com"
    kdf: str = ""
    type: Message = Message.SIGNUP

    @classmethod
    def cast(cls, d: dict) -> Self:
        return from_dict(cls, d)


@dataclass
class ServerSignup(ServerResponse):
    type: Message = Message.SIGNUP
    ok: bool = True
    token: str = ""