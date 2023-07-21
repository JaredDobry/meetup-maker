from argon2 import PasswordHasher
from argon2.exceptions import VerificationError
from sqlite3 import connect, Connection
from pathlib import Path
from logging import getLogger
from sys import exit

from meetup_maker.api import ClientSignup, User, Event, Participant

logger = getLogger("meetup-maker")


def kdf(password: str) -> str:
    ph = PasswordHasher()
    return ph.hash(password)


def connect_db(
    dbfile: str,
) -> Connection:
    try:
        c = connect(Path(dbfile).expanduser())
        return c
    except IOError as e:
        err = f"Failed to connect to dbfile at {dbfile} - {e}"
        logger.exception(err)
        exit(1)


def create_tables(c: Connection):
    cursor = c.cursor()

    try:
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                kdf TEXT NOT NULL
                );
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                owner INTEGER,
                invite_code TEXT NOT NULL UNIQUE,
                FOREIGN KEY (owner)
                    REFERENCES users (id)
            );
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS participants (
                id INTEGER PRIMARY KEY,
                event_id INTEGER,
                user_id INTEGER,
                FOREIGN KEY (event_id)
                    REFERENCES events (id)
                FOREIGN KEY (user_id)
                    REFERENCES users (id)
            );
            """
        )
        c.commit()
    except Exception as e:
        logger.exception(f"Exception while creating tables - {e}")
        c.rollback()
        exit(1)


def user_exists(c: Connection, email: str) -> bool:
    cursor = c.cursor()
    cursor.execute(
        """
        SELECT 1
        FROM users
        WHERE email = ?
        """,
        (email,),
    )
    result = cursor.fetchone()
    return result is not None


def credentials_valid(c: Connection, email: str, password: str) -> bool:
    cursor = c.cursor()
    cursor.execute(
        """
        SELECT kdf
        FROM users
        WHERE email = ?
        """,
        (email,),
    )
    result = cursor.fetchone()
    if not result:
        return False
    result = result[0]

    ph = PasswordHasher.from_parameters(result)
    try:
        ph.verify(result, password)
        return True
    except VerificationError:
        logger.warning(f"Invalid credentials supplied for user {email}")
        return False


def add_user(c: Connection, signup: ClientSignup) -> bool:
    cursor = c.cursor()
    try:
        cursor.execute(
            """
            INSERT INTO users (first_name, last_name, email, kdf)
            VALUES (?, ?, ?, ?)
            """,
            (signup.first_name, signup.last_name, signup.email, kdf(signup.password)),
        )
        c.commit()
        return True
    except Exception as e:
        logger.exception(f"Exception while creating user {signup} - {e}")
        c.rollback()
        return False
