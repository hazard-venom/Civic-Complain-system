from pydantic_settings import BaseSettings
from pydantic import EmailStr


class UserCreate(BaseSettings):
    name: str
    email: EmailStr
    password: str
    
