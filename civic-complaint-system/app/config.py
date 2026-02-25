from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    SMTP_HOST: str | None = None
    SMTP_PORT: int = 587
    SMTP_USERNAME: str | None = None
    SMTP_PASSWORD: str | None = None
    SMTP_FROM_EMAIL: str | None = None
    SMTP_USE_TLS: bool = True

    SMS_ACCOUNT_SID: str | None = None
    SMS_AUTH_TOKEN: str | None = None
    SMS_FROM_NUMBER: str | None = None

    PMO_EMAIL: str | None = None
    PMO_ESCALATION_HOURS: int = 48
    PMO_CHECK_INTERVAL_MINUTES: int = 15

    class Config:
        env_file = ".env"


settings = Settings()
