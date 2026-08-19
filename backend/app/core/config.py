from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import List, Union
import os

class Settings(BaseSettings):
    # Database
    postgres_user: str = "sempoa_dev"
    postgres_password: str = "dev_password_change_in_production"
    postgres_db: str = "sempoa_sip"
    postgres_host: str = "localhost"
    postgres_port: int = 5433
    
    # FastAPI
    fastapi_env: str = "development"
    secret_key: str = "sempoa_super_secret_jwt_key_pariaman_2026_dev"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 7
    
    # ESP32 Hardware
    esp32_api_key: str = "SempoaPariaman_ESP32_SecureKey_2026!"

    # Redis (For token blacklist & persistent rate limiting)
    redis_host: str = "redis"
    redis_port: int = 6379
    
    # CORS
    allowed_origins: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://sempoasippariaman.com",
        "https://www.sempoasippariaman.com",
        "http://202.155.157.22",
        "https://202.155.157.22",
    ]
    
    @field_validator("secret_key")
    @classmethod
    def validate_secret_key(cls, v, info):
        env = os.getenv("FASTAPI_ENV", "development")
        if env == "production":
            if not v or v == "sempoa_super_secret_jwt_key_pariaman_2026_dev":
                raise ValueError("SECRET_KEY harus di-set dengan value unik dan random di production. Jalankan: python -c \"import secrets; print(secrets.token_hex(64))\"")
            if len(v) < 32:
                raise ValueError("SECRET_KEY terlalu pendek. Minimal 32 karakter.")
        if not v:
            return "sempoa_super_secret_jwt_key_pariaman_2026_dev"
        return v

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_allowed_origins(cls, v):
        if isinstance(v, str):
            return [x.strip() for x in v.split(",") if x.strip()]
        return v
    
    # Logging
    log_level: str = "INFO"
    
    @property
    def database_url(self) -> str:
        return f"postgresql://{self.postgres_user}:{self.postgres_password}@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
    
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False
    )

settings = Settings()

