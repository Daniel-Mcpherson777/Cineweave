import hmac
import hashlib
import logging
from fastapi import FastAPI, HTTPException, Depends, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional

from config import get_settings
from auth import verify_clerk_token, get_user_id_from_token
from runpod_client import runpod_client
from r2_client import r2_client
import db_client
from models import (
    CreateJobRequest,
    CreateJobResponse,
    JobStatusResponse,
    CreditsResponse,
    RunPodWebhookPayload,
    ErrorResponse,
    HealthResponse,
)

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Settings
settings = get_settings()

# FastAPI app
app = FastAPI(
    title="CineWeave API Gateway",
    description="AI-powered video generation API",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.app_base_url, "http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Startup and shutdown events
@app.on_event("startup")
async def startup():
    await db_client.connect_db()
    logger.info("Database connected")


@app.on_event("shutdown")
async def shutdown():
    await db_client.disconnect_db()
    logger.info("Database disconnected")


# Exception handlers
@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "code": "INTERNAL_ERROR"}
    )


# Health check
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        environment=settings.environment,
    )


# Get or create user (called by frontend after Clerk auth)
@app.post("/users/init")
async def initialize_user(token_payload: dict = Depends(verify_clerk_token)):
    """Initialize or retrieve user from database"""
    try:
        clerk_id = get_user_id_from_token(token_payload)
        email = token_payload.get('email', '')

        user = await db_client.get_or_create_user(clerk_id, email)

        return user
    except Exception as e:
        logger.error(f"Failed to initialize user: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to initialize user: {str(e)}")


# Get user credits
@app.get("/credits", response_model=CreditsResponse)
async def get_credits(token_payload: dict = Depends(verify_clerk_token)):
    """Get user's current credit balance"""
    try:
        clerk_id = get_user_id_from_token(token_payload)

        # Get user
        user = await db_client.get_user_by_clerk_id(clerk_id)

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Get credits
        credits_data = await db_client.get_credits(user["_id"])

        return CreditsResponse(**credits_data)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get credits: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get credits: {str(e)}")


# Create a new job
@app.post("/jobs/create", response_model=CreateJobResponse)
async def create_job(
    request: CreateJobRequest,
    token_payload: dict = Depends(verify_clerk_token)
):
    """Create a new video generation job"""
    try:
        clerk_id = get_user_id_from_token(token_payload)

        # Get user
        user = await db_client.get_user_by_clerk_id(clerk_id)

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user_id = user["_id"]

        # Check rate limiting (max concurrent jobs)
        active_jobs = await db_client.count_active_jobs(user_id)

        if active_jobs >= settings.max_concurrent_jobs_per_user:
            raise HTTPException(
                status_code=429,
                detail=f"Maximum {settings.max_concurrent_jobs_per_user} concurrent jobs allowed"
            )

        # Calculate credits needed
        credits_needed = request.durationSec // 5

        # Check user has enough credits
        if user["credits"] < credits_needed:
            raise HTTPException(
                status_code=402,
                detail=f"Insufficient credits. Need {credits_needed}, have {user['credits']}"
            )

        # Create job in database
        job_id = await db_client.create_job(
            user_id=user_id,
            prompt=request.prompt,
            duration_sec=request.durationSec,
            credits_used=credits_needed,
            image_url=request.imageUrl,
            seed=request.seed,
            cfg=request.cfg or 7.5,
        )

        # Reserve credits
        try:
            await db_client.reserve_credits(
                user_id=user_id,
                credits=credits_needed,
                job_id=job_id,
                description=f"Video generation ({request.durationSec}s)"
            )
        except Exception as e:
            # Delete job if credit reservation fails
            await db_client.update_job_status(
                job_id=job_id,
                status="failed",
                error_message=str(e)
            )
            raise HTTPException(status_code=402, detail=str(e))

        # Submit to RunPod
        try:
            runpod_response = await runpod_client.submit_job(
                prompt=request.prompt,
                duration_sec=request.durationSec,
                image_url=request.imageUrl,
                seed=request.seed,
                cfg=request.cfg or 7.5,
            )

            runpod_job_id = runpod_response.get("id")

            # Update job with RunPod job ID
            await db_client.update_job_status(
                job_id=job_id,
                status="running",
                runpod_job_id=runpod_job_id
            )

            logger.info(f"Job {job_id} submitted to RunPod as {runpod_job_id}")

        except Exception as e:
            logger.error(f"Failed to submit to RunPod: {str(e)}")
            # Refund credits and mark job as failed
            await db_client.refund_credits(
                user_id=user_id,
                credits=credits_needed,
                job_id=job_id,
                reason="RunPod submission failed"
            )
            await db_client.update_job_status(
                job_id=job_id,
                status="failed",
                error_message=str(e)
            )
            raise HTTPException(status_code=500, detail=f"Failed to submit job: {str(e)}")

        return CreateJobResponse(
            jobId=job_id,
            creditsUsed=credits_needed,
            creditsRemaining=user["credits"] - credits_needed
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create job: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create job: {str(e)}")


# Get job status
@app.get("/jobs/{job_id}", response_model=JobStatusResponse)
async def get_job_status(
    job_id: str,
    token_payload: dict = Depends(verify_clerk_token)
):
    """Get status of a video generation job"""
    try:
        clerk_id = get_user_id_from_token(token_payload)

        # Get user
        user = await db_client.get_user_by_clerk_id(clerk_id)

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Get job
        job = await db_client.get_job(job_id)

        if not job:
            raise HTTPException(status_code=404, detail="Job not found")

        # Verify job belongs to user
        if job["userId"] != user["_id"]:
            raise HTTPException(status_code=403, detail="Access denied")

        # Generate presigned URL if video is ready
        r2_url = None
        if job.get("r2Url"):
            # Extract key from R2 URL
            r2_key = job["r2Url"].split("/")[-1]
            # Generate presigned URL valid for 24 hours
            r2_url = r2_client.generate_presigned_url(f"outputs/{r2_key}", expiration=86400)

        return JobStatusResponse(
            jobId=job["_id"],
            status=job["status"],
            prompt=job["prompt"],
            durationSec=job["durationSec"],
            creditsUsed=job["creditsUsed"],
            r2Url=r2_url,
            expiresAt=job.get("expiresAt"),
            errorMessage=job.get("errorMessage"),
            createdAt=job["createdAt"],
            updatedAt=job["updatedAt"],
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get job: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get job: {str(e)}")


# List user's jobs
@app.get("/jobs")
async def list_jobs(
    limit: int = 20,
    token_payload: dict = Depends(verify_clerk_token)
):
    """List user's video generation jobs"""
    try:
        clerk_id = get_user_id_from_token(token_payload)

        # Get user
        user = await db_client.get_user_by_clerk_id(clerk_id)

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Get jobs
        jobs = await db_client.list_user_jobs(user["_id"], limit)

        return jobs

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to list jobs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list jobs: {str(e)}")


# RunPod webhook
@app.post("/webhooks/runpod")
async def runpod_webhook(
    payload: RunPodWebhookPayload,
    x_runpod_signature: Optional[str] = Header(None)
):
    """Handle RunPod job completion webhook"""
    try:
        # Verify webhook signature
        if x_runpod_signature:
            # Create HMAC signature
            expected_signature = hmac.new(
                settings.webhook_runpod_secret.encode(),
                payload.json().encode(),
                hashlib.sha256
            ).hexdigest()

            if not hmac.compare_digest(x_runpod_signature, expected_signature):
                logger.warning("Invalid RunPod webhook signature")
                raise HTTPException(status_code=401, detail="Invalid signature")

        logger.info(f"Received RunPod webhook for job {payload.id}: {payload.status}")

        # Get job by RunPod job ID
        job = await db_client.get_job_by_runpod_id(payload.id)

        if not job:
            logger.warning(f"Job not found for RunPod ID: {payload.id}")
            return {"status": "job not found"}

        job_id = job["_id"]
        user_id = job["userId"]

        # Handle completed job
        if payload.status == "COMPLETED":
            if not payload.output or "r2Url" not in payload.output:
                logger.error(f"No R2 URL in RunPod output for job {job_id}")
                # Refund credits
                await db_client.refund_credits(
                    user_id=user_id,
                    credits=job["creditsUsed"],
                    job_id=job_id,
                    reason="Missing video output"
                )
                await db_client.update_job_status(
                    job_id=job_id,
                    status="failed",
                    error_message="Missing video output"
                )
                return {"status": "failed", "reason": "missing output"}

            # Update job with video URL
            await db_client.update_job_status(
                job_id=job_id,
                status="done",
                r2_url=payload.output["r2Url"]
            )

            logger.info(f"Job {job_id} completed successfully")
            return {"status": "success"}

        # Handle failed job
        elif payload.status == "FAILED":
            error_message = payload.error or "Unknown error"

            # Refund credits
            await db_client.refund_credits(
                user_id=user_id,
                credits=job["creditsUsed"],
                job_id=job_id,
                reason=error_message
            )

            # Update job status
            await db_client.update_job_status(
                job_id=job_id,
                status="failed",
                error_message=error_message
            )

            logger.info(f"Job {job_id} failed: {error_message}")
            return {"status": "refunded"}

        else:
            logger.info(f"Job {job_id} status: {payload.status}")
            return {"status": "acknowledged"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Webhook processing error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
