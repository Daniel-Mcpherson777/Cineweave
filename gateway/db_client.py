"""Database client using Prisma"""
from prisma import Prisma
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta

# Singleton Prisma client
db = Prisma()


async def connect_db():
    """Connect to database"""
    if not db.is_connected():
        await db.connect()


async def disconnect_db():
    """Disconnect from database"""
    if db.is_connected():
        await db.disconnect()


# User operations
async def get_or_create_user(clerk_id: str, email: str) -> Dict[str, Any]:
    """Get or create user by Clerk ID"""
    user = await db.user.find_unique(where={"clerkId": clerk_id})

    if user:
        return {
            "_id": user.id,
            "clerkId": user.clerkId,
            "email": user.email,
            "plan": user.plan,
            "credits": user.credits,
            "createdAt": int(user.createdAt.timestamp() * 1000),
        }

    # Create new user with 80 starter credits
    user = await db.user.create(
        data={
            "clerkId": clerk_id,
            "email": email,
            "plan": "starter",
            "credits": 80,
        }
    )

    # Create initial credit ledger entry
    await db.creditledger.create(
        data={
            "userId": user.id,
            "amount": 80,
            "balanceAfter": 80,
            "type": "subscription",
            "description": "Welcome credits - Starter plan",
        }
    )

    return {
        "_id": user.id,
        "clerkId": user.clerkId,
        "email": user.email,
        "plan": user.plan,
        "credits": user.credits,
        "createdAt": int(user.createdAt.timestamp() * 1000),
    }


async def get_user_by_clerk_id(clerk_id: str) -> Optional[Dict[str, Any]]:
    """Get user by Clerk ID"""
    user = await db.user.find_unique(where={"clerkId": clerk_id})

    if not user:
        return None

    return {
        "_id": user.id,
        "clerkId": user.clerkId,
        "email": user.email,
        "plan": user.plan,
        "credits": user.credits,
        "createdAt": int(user.createdAt.timestamp() * 1000),
    }


async def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """Get user by ID"""
    user = await db.user.find_unique(where={"id": user_id})

    if not user:
        return None

    return {
        "_id": user.id,
        "clerkId": user.clerkId,
        "email": user.email,
        "plan": user.plan,
        "credits": user.credits,
        "createdAt": int(user.createdAt.timestamp() * 1000),
    }


# Job operations
async def create_job(
    user_id: str,
    prompt: str,
    duration_sec: int,
    credits_used: int,
    image_url: Optional[str] = None,
    seed: Optional[int] = None,
    cfg: float = 7.5,
) -> str:
    """Create a new job"""
    job = await db.job.create(
        data={
            "userId": user_id,
            "prompt": prompt,
            "imageUrl": image_url,
            "durationSec": duration_sec,
            "creditsUsed": credits_used,
            "status": "queued",
            "seed": seed,
            "cfg": cfg,
        }
    )

    return job.id


async def update_job_status(
    job_id: str,
    status: str,
    runpod_job_id: Optional[str] = None,
    r2_url: Optional[str] = None,
    error_message: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """Update job status"""
    update_data: Dict[str, Any] = {"status": status}

    if runpod_job_id:
        update_data["runpodJobId"] = runpod_job_id

    if r2_url:
        update_data["r2Url"] = r2_url

    if error_message:
        update_data["errorMessage"] = error_message

    # Set expiration for completed jobs (24 hours)
    if status == "done":
        update_data["expiresAt"] = datetime.utcnow() + timedelta(hours=24)

    job = await db.job.update(
        where={"id": job_id},
        data=update_data
    )

    return {
        "_id": job.id,
        "userId": job.userId,
        "prompt": job.prompt,
        "imageUrl": job.imageUrl,
        "durationSec": job.durationSec,
        "creditsUsed": job.creditsUsed,
        "status": job.status,
        "runpodJobId": job.runpodJobId,
        "r2Url": job.r2Url,
        "errorMessage": job.errorMessage,
        "expiresAt": int(job.expiresAt.timestamp() * 1000) if job.expiresAt else None,
        "createdAt": int(job.createdAt.timestamp() * 1000),
        "updatedAt": int(job.updatedAt.timestamp() * 1000),
    }


async def get_job(job_id: str) -> Optional[Dict[str, Any]]:
    """Get job by ID"""
    job = await db.job.find_unique(where={"id": job_id})

    if not job:
        return None

    return {
        "_id": job.id,
        "userId": job.userId,
        "prompt": job.prompt,
        "imageUrl": job.imageUrl,
        "durationSec": job.durationSec,
        "creditsUsed": job.creditsUsed,
        "status": job.status,
        "r2Url": job.r2Url,
        "errorMessage": job.errorMessage,
        "expiresAt": int(job.expiresAt.timestamp() * 1000) if job.expiresAt else None,
        "createdAt": int(job.createdAt.timestamp() * 1000),
        "updatedAt": int(job.updatedAt.timestamp() * 1000),
    }


async def get_job_by_runpod_id(runpod_job_id: str) -> Optional[Dict[str, Any]]:
    """Get job by RunPod job ID"""
    job = await db.job.find_unique(where={"runpodJobId": runpod_job_id})

    if not job:
        return None

    return {
        "_id": job.id,
        "userId": job.userId,
        "prompt": job.prompt,
        "durationSec": job.durationSec,
        "creditsUsed": job.creditsUsed,
        "status": job.status,
        "r2Url": job.r2Url,
        "errorMessage": job.errorMessage,
        "createdAt": int(job.createdAt.timestamp() * 1000),
        "updatedAt": int(job.updatedAt.timestamp() * 1000),
    }


async def list_user_jobs(user_id: str, limit: int = 20) -> List[Dict[str, Any]]:
    """List user's jobs"""
    jobs = await db.job.find_many(
        where={"userId": user_id},
        order={"createdAt": "desc"},
        take=limit
    )

    return [
        {
            "_id": job.id,
            "userId": job.userId,
            "prompt": job.prompt,
            "durationSec": job.durationSec,
            "creditsUsed": job.creditsUsed,
            "status": job.status,
            "r2Url": job.r2Url,
            "errorMessage": job.errorMessage,
            "createdAt": int(job.createdAt.timestamp() * 1000),
            "updatedAt": int(job.updatedAt.timestamp() * 1000),
        }
        for job in jobs
    ]


async def count_active_jobs(user_id: str) -> int:
    """Count active jobs for rate limiting"""
    count = await db.job.count(
        where={
            "userId": user_id,
            "status": {"in": ["queued", "running"]}
        }
    )

    return count


# Credit operations
async def get_credits(user_id: str) -> Dict[str, Any]:
    """Get user's credit balance"""
    user = await db.user.find_unique(where={"id": user_id})

    if not user:
        raise Exception("User not found")

    return {
        "credits": user.credits,
        "plan": user.plan,
    }


async def reserve_credits(
    user_id: str,
    credits: int,
    job_id: str,
    description: str
) -> None:
    """Reserve credits for a job"""
    user = await db.user.find_unique(where={"id": user_id})

    if not user:
        raise Exception("User not found")

    if user.credits < credits:
        raise Exception(f"Insufficient credits. Need {credits}, have {user.credits}")

    new_balance = user.credits - credits

    # Update user credits
    await db.user.update(
        where={"id": user_id},
        data={"credits": new_balance}
    )

    # Create ledger entry
    await db.creditledger.create(
        data={
            "userId": user_id,
            "amount": -credits,
            "balanceAfter": new_balance,
            "type": "subscription",
            "description": description,
            "jobId": job_id,
        }
    )


async def refund_credits(
    user_id: str,
    credits: int,
    job_id: str,
    reason: str
) -> None:
    """Refund credits"""
    user = await db.user.find_unique(where={"id": user_id})

    if not user:
        raise Exception("User not found")

    new_balance = user.credits + credits

    # Update user credits
    await db.user.update(
        where={"id": user_id},
        data={"credits": new_balance}
    )

    # Create ledger entry
    await db.creditledger.create(
        data={
            "userId": user_id,
            "amount": credits,
            "balanceAfter": new_balance,
            "type": "refund",
            "description": f"Refund: {reason}",
            "jobId": job_id,
        }
    )
