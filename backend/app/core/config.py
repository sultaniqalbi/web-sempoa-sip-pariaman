from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

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
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    
    # ESP32 Hardware
    esp32_api_key: str = "SempoaPariaman_ESP32_SecureKey_2026!"
    
    # CORS
    allowed_origins: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    
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
