import re

from pydantic import BaseModel, EmailStr, field_validator


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        cleaned = value.strip()
        if len(cleaned) < 2:
            raise ValueError("Name must be at least 2 characters")
        if not re.fullmatch(r"[A-Za-z][A-Za-z\s'-]*", cleaned):
            raise ValueError("Name can contain only letters, spaces, apostrophes, and hyphens")
        return cleaned

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        cleaned = value.strip()
        if not re.fullmatch(r"\+?[0-9]{10,15}", cleaned):
            raise ValueError("Phone must be 10 to 15 digits and may start with +")
        return cleaned
