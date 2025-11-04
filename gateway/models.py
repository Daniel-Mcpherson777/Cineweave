from pydantic import BaseModel, Field, validator
from typing import Optional


class CreateJobRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=500, description="Text prompt for video generation")
    imageUrl: Optional[str] = Field(None, description="Optional image URL for image-to-video")
    durationSec: int = Field(..., description="Video duration in seconds (5, 10, or 15)")
    seed: Optional[int] = Field(None, description="Random seed for reproducibility")
    cfg: Optional[float] = Field(7.5, ge=1.0, le=20.0, description="Classifier-free guidance scale")

    @validator('durationSec')
    def validate_duration(cls, v):
        if v not in [5, 10, 15]:
            raise ValueError('Duration must be 5, 10, or 15 seconds')
        return v


class CreateJobResponse(BaseModel):
    jobId: str
    creditsUsed: int
    creditsRemaining: int


class JobStatusResponse(BaseModel):
    jobId: str
    status: str
    prompt: str
    durationSec: int
    creditsUsed: int
    r2Url: Optional[str] = None
    expiresAt: Optional[int] = None
    errorMessage: Optional[str] = None
    createdAt: int
    updatedAt: int


class CreditsResponse(BaseModel):
    credits: int
    plan: str
    planDetails: Optional[dict] = None


class RunPodWebhookPayload(BaseModel):
    id: str
    status: str
    output: Optional[dict] = None
    error: Optional[str] = None


class ErrorResponse(BaseModel):
    detail: str
    code: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    environment: str
    version: str = "1.0.0"
