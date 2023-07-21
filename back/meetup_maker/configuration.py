from dataclasses import asdict, dataclass
from logging import INFO, FileHandler, Formatter, Logger, StreamHandler, getLogger
from pathlib import Path
from sys import exit, stdout
from typing import Any, Optional

from dacite import from_dict
from yaml import safe_load

logger = getLogger("meetup-maker")


def setup_logging(
    logger: Logger, level: int = INFO, file: Optional[Path] = None
) -> None:
    formatter = Formatter("%(levelname)s | %(asctime)s | %(message)s")
    stream_handler = StreamHandler(stdout)
    stream_handler.setFormatter(formatter)
    logger.addHandler(stream_handler)

    if file:
        file_handler = FileHandler(file)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)

    logger.setLevel(level)


@dataclass
class DatabaseConfiguration:
    path: str


@dataclass
class LoggingConfiguration:
    file: Optional[str]
    level: Optional[int]


@dataclass
class ServerConfiguration:
    bind_address: str
    bind_port: int
    session_length: int


@dataclass
class Configuration:
    database: DatabaseConfiguration
    logging: Optional[LoggingConfiguration]
    server: ServerConfiguration

    def dict(self) -> dict[str, Any]:
        return asdict(self)


def load_configuration(cfile: Path) -> Configuration:
    if not cfile.exists():
        logger.exception(f"Configuration file {cfile} does not exist")
        exit(1)
    if cfile.is_dir():
        logger.exception(f"Configuration file {cfile} is a directory")
        exit(1)

    try:
        with open(cfile, "r") as fr:
            cstr = fr.read()
    except IOError as e:
        logger.exception(f"Exception reading configuration file {cfile} - {e}")
        exit(1)

    try:
        yaml_dict = safe_load(cstr)
        return from_dict(Configuration, yaml_dict)
    except Exception as e:
        logger.exception(f"Exception parsing configuration file {cfile} - {e}")
        exit(1)
