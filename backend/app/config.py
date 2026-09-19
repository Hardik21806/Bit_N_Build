"""
app/config.py
Centralized settings loaded from environment variables (.env).
"""
from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Supabase
    SUPABASE_URL: str
    SUPABASE_KEY: str

    # Groq
    GROQ_API_KEY: str
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    # Email
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = ""
    ALERT_EMAIL_RECIPIENTS: str = ""

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173"

    # SLA (minutes) per severity, used for escalation
    SLA_CRITICAL_MINUTES: int = 10
    SLA_HIGH_MINUTES: int = 30
    SLA_MEDIUM_MINUTES: int = 60
    SLA_LOW_MINUTES: int = 120

    # Duplicate detection
    DUPLICATE_DISTANCE_KM: float = 1.5
    DUPLICATE_TIME_WINDOW_MINUTES: int = 60
    DUPLICATE_TEXT_SIMILARITY_THRESHOLD: int = 70

    # Scheduler
    ESCALATION_CHECK_INTERVAL_SECONDS: int = 60

    @property
    def cors_origin_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def alert_recipient_list(self) -> List[str]:
        return [e.strip() for e in self.ALERT_EMAIL_RECIPIENTS.split(",") if e.strip()]

    def sla_minutes_for(self, severity: str) -> int:
        mapping = {
            "critical": self.SLA_CRITICAL_MINUTES,
            "high": self.SLA_HIGH_MINUTES,
            "medium": self.SLA_MEDIUM_MINUTES,
            "low": self.SLA_LOW_MINUTES,
        }
        return mapping.get(severity, self.SLA_MEDIUM_MINUTES)


@lru_cache
def get_settings() -> Settings:
    return Settings()