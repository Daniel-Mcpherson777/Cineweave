import httpx
from typing import Optional, Dict, Any
from config import get_settings

settings = get_settings()


class RunPodClient:
    """Client for RunPod Serverless API"""

    def __init__(self):
        self.api_url = settings.runpod_api_url
        self.endpoint_id = settings.runpod_endpoint_id
        self.api_key = settings.runpod_api_key

    async def submit_job(
        self,
        prompt: str,
        duration_sec: int,
        image_url: Optional[str] = None,
        seed: Optional[int] = None,
        cfg: float = 7.5,
    ) -> Dict[str, Any]:
        """
        Submit a video generation job to RunPod

        Args:
            prompt: Text prompt for video generation
            duration_sec: Video duration (5, 10, or 15)
            image_url: Optional image URL for image-to-video
            seed: Optional random seed for reproducibility
            cfg: Classifier-free guidance scale

        Returns:
            RunPod job response with job ID
        """
        url = f"{self.api_url}/{self.endpoint_id}/run"

        payload = {
            "input": {
                "prompt": prompt,
                "durationSec": duration_sec,
                "seed": seed,
                "cfg": cfg,
            }
        }

        if image_url:
            payload["input"]["imageUrl"] = image_url

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            return response.json()

    async def get_job_status(self, job_id: str) -> Dict[str, Any]:
        """
        Get status of a RunPod job

        Args:
            job_id: RunPod job ID

        Returns:
            Job status information
        """
        url = f"{self.api_url}/{self.endpoint_id}/status/{job_id}"

        headers = {
            "Authorization": f"Bearer {self.api_key}",
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            return response.json()

    async def cancel_job(self, job_id: str) -> Dict[str, Any]:
        """
        Cancel a RunPod job

        Args:
            job_id: RunPod job ID

        Returns:
            Cancellation confirmation
        """
        url = f"{self.api_url}/{self.endpoint_id}/cancel/{job_id}"

        headers = {
            "Authorization": f"Bearer {self.api_key}",
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, headers=headers)
            response.raise_for_status()
            return response.json()


# Singleton instance
runpod_client = RunPodClient()
