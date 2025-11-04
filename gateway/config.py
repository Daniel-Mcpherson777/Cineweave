from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    environment: str = "development"
    app_base_url: str = "https://app.cineweave.com"
    log_level: str = "INFO"

    # Clerk
    clerk_jwks_url: str
    clerk_issuer: str

    # Convex
    convex_url: str
    convex_admin_key: str

    # RunPod
    runpod_endpoint_id: str
    runpod_api_key: str
    runpod_api_url: str = "https://api.runpod.ai/v2"

    # Cloudflare R2
    r2_account_id: str
    r2_bucket: str
    r2_access_key_id: str
    r2_secret_access_key: str
    r2_public_domain: str
    r2_endpoint_url: str

    # Webhook security
    webhook_runpod_secret: str

    # Rate limiting
    max_concurrent_jobs_per_user: int = 5

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()
