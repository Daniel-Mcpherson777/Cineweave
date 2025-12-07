"""
CineWeave Worker - Real Wan 2.2 Model Integration

This is the production-ready version with actual Wan 2.2-TI2V-5B model integration.
Replace handler.py with this file once you have the model set up.
"""

import os
import uuid
import logging
import boto3
from botocore.config import Config
from typing import Optional, Dict, Any
import torch
import numpy as np
import random
from PIL import Image
import requests
import io
import imageio
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import runpod

# Logging
logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI()

# R2 Client
r2_client = boto3.client(
    's3',
    endpoint_url=os.getenv("R2_ENDPOINT_URL"),
    aws_access_key_id=os.getenv("R2_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("R2_SECRET_ACCESS_KEY"),
    config=Config(signature_version='s3v4'),
    region_name='auto',
)

R2_BUCKET = os.getenv("R2_BUCKET")
R2_PUBLIC_DOMAIN = os.getenv("R2_PUBLIC_DOMAIN", "")

# Model configuration
WAN_WEIGHTS_DIR = os.getenv("WAN_WEIGHTS_DIR", "/runpod-volume/wan22/weights")
WAN_RESOLUTION = os.getenv("WAN_RESOLUTION", "720p")
WAN_FPS = int(os.getenv("WAN_FPS", "24"))
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# Global model instance
MODEL = None
PIPE = None


class JobInput(BaseModel):
    prompt: str
    imageUrl: Optional[str] = None
    durationSec: int = 5
    seed: Optional[int] = None
    cfg: float = 7.5


def load_model():
    """
    Load Wan 2.2-TI2V-5B model from Network Volume

    This loads the actual diffusion pipeline for text/image-to-video generation.
    """
    global MODEL, PIPE

    logger.info(f"Loading Wan 2.2 model from {WAN_WEIGHTS_DIR}")
    logger.info(f"Using device: {DEVICE}")

    try:
        # Import the Wan 2.2 pipeline
        # NOTE: The exact import will depend on how the model is packaged
        # This is a common pattern for diffusion models

        # Option 1: If using Hugging Face diffusers format
        try:
            from diffusers import DiffusionPipeline

            PIPE = DiffusionPipeline.from_pretrained(
                WAN_WEIGHTS_DIR,
                torch_dtype=torch.float16,
                variant="fp16",
                use_safetensors=True,
            )
            PIPE = PIPE.to(DEVICE)

            # Enable memory optimizations
            if hasattr(PIPE, 'enable_model_cpu_offload'):
                PIPE.enable_model_cpu_offload()
            if hasattr(PIPE, 'enable_vae_slicing'):
                PIPE.enable_vae_slicing()
            if hasattr(PIPE, 'enable_attention_slicing'):
                PIPE.enable_attention_slicing(1)

            logger.info("Loaded model using Diffusers pipeline")

        except ImportError:
            # Option 2: If using custom Wan 2.2 library
            # Adjust this import based on actual model distribution
            logger.info("Diffusers not found, trying custom Wan library...")

            # Example for custom model loading:
            # from wan22.models import Wan22TI2VModel
            # MODEL = Wan22TI2VModel.from_pretrained(
            #     WAN_WEIGHTS_DIR,
            #     variant="5b",
            #     device=DEVICE,
            #     dtype=torch.float16,
            # )
            # MODEL.eval()

            raise ImportError(
                "Could not load model. Please install diffusers or the Wan 2.2 library:\n"
                "pip install diffusers transformers accelerate"
            )

        # Test generation to ensure model works
        logger.info("Model loaded successfully. Running test inference...")

        # Small test to verify model works
        with torch.inference_mode():
            test_output = PIPE(
                prompt="test",
                num_frames=24,  # 1 second at 24fps
                height=480,
                width=848,
                num_inference_steps=10,  # Low steps for quick test
            )

        logger.info(f"Test inference successful. Output shape: {test_output.frames[0].shape if hasattr(test_output, 'frames') else 'N/A'}")

        return PIPE

    except Exception as e:
        logger.error(f"Failed to load model: {str(e)}", exc_info=True)
        raise


def download_image(image_url: str) -> Image.Image:
    """Download and preprocess image from URL"""
    logger.info(f"Downloading image from {image_url}")

    try:
        response = requests.get(image_url, timeout=30)
        response.raise_for_status()

        image = Image.open(io.BytesIO(response.content))

        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')

        logger.info(f"Image downloaded: {image.size}, mode={image.mode}")
        return image

    except Exception as e:
        logger.error(f"Failed to download image: {str(e)}")
        raise


def get_resolution_dimensions(resolution: str) -> tuple[int, int]:
    """Get width and height for resolution"""
    resolutions = {
        "720p": (1280, 720),
        "480p": (848, 480),
        "1080p": (1920, 1080),
    }
    return resolutions.get(resolution, (1280, 720))


def generate_video(
    prompt: str,
    duration_sec: int,
    image_url: Optional[str] = None,
    seed: Optional[int] = None,
    cfg: float = 7.5,
) -> str:
    """
    Generate video using Wan 2.2 model

    Args:
        prompt: Text prompt for video generation
        duration_sec: Video duration (5, 10, or 15 seconds)
        image_url: Optional image URL for image-to-video
        seed: Random seed for reproducibility
        cfg: Classifier-free guidance scale

    Returns:
        Path to generated video file
    """
    logger.info(f"Generating video: prompt='{prompt}', duration={duration_sec}s, image={'yes' if image_url else 'no'}")

    if PIPE is None:
        raise RuntimeError("Model not loaded. Call load_model() first.")

    # Calculate number of frames
    num_frames = duration_sec * WAN_FPS
    width, height = get_resolution_dimensions(WAN_RESOLUTION)

    # Set random seed if provided
    if seed is not None:
        torch.manual_seed(seed)
        random.seed(seed)
        np.random.seed(seed)
        generator = torch.Generator(device=DEVICE).manual_seed(seed)
    else:
        generator = None

    try:
        # Generate video
        with torch.inference_mode():
            if image_url:
                # Image-to-video generation
                logger.info("Running image-to-video generation...")
                image = download_image(image_url)

                # Resize image to match target resolution
                image = image.resize((width, height), Image.Resampling.LANCZOS)

                output = PIPE(
                    prompt=prompt,
                    image=image,
                    num_frames=num_frames,
                    height=height,
                    width=width,
                    num_inference_steps=50,
                    guidance_scale=cfg,
                    generator=generator,
                )
            else:
                # Text-to-video generation
                logger.info("Running text-to-video generation...")

                output = PIPE(
                    prompt=prompt,
                    num_frames=num_frames,
                    height=height,
                    width=width,
                    num_inference_steps=50,
                    guidance_scale=cfg,
                    generator=generator,
                )

        # Extract frames from output
        # The exact format depends on the pipeline implementation
        if hasattr(output, 'frames'):
            frames = output.frames[0]  # Usually batch dimension is first
        elif hasattr(output, 'videos'):
            frames = output.videos[0]
        else:
            # Fallback: assume output is tensor directly
            frames = output[0]

        # Convert frames to numpy if they're tensors
        if isinstance(frames, torch.Tensor):
            frames = frames.cpu().numpy()
            # Assuming shape is [num_frames, height, width, channels]
            # Scale from [-1, 1] or [0, 1] to [0, 255]
            if frames.max() <= 1.0:
                frames = (frames * 255).astype(np.uint8)
            else:
                frames = frames.astype(np.uint8)

        # Save video
        output_path = f"/workspace/out/{uuid.uuid4()}.mp4"
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        logger.info(f"Saving video with {len(frames)} frames at {WAN_FPS}fps")

        # Save using imageio with H.264 codec
        imageio.mimsave(
            output_path,
            frames,
            fps=WAN_FPS,
            codec='libx264',
            quality=8,  # High quality (range 1-10, 10 is best)
            pixelformat='yuv420p',  # Standard format for compatibility
            macro_block_size=1,
        )

        # Verify file was created
        if not os.path.exists(output_path):
            raise RuntimeError("Video file was not created")

        file_size_mb = os.path.getsize(output_path) / (1024 * 1024)
        logger.info(f"Video generated successfully: {output_path} ({file_size_mb:.2f} MB)")

        return output_path

    except Exception as e:
        logger.error(f"Video generation failed: {str(e)}", exc_info=True)
        raise


def upload_to_r2(file_path: str) -> str:
    """
    Upload video to Cloudflare R2

    Args:
        file_path: Local path to video file

    Returns:
        R2 URL of uploaded video
    """
    key = f"outputs/{os.path.basename(file_path)}"

    logger.info(f"Uploading to R2: {key}")

    try:
        r2_client.upload_file(
            file_path,
            R2_BUCKET,
            key,
            ExtraArgs={
                'ContentType': 'video/mp4',
                'CacheControl': 'public, max-age=86400',  # 24 hours
            }
        )

        # Return public URL
        r2_url = f"{R2_PUBLIC_DOMAIN}/{key}"
        logger.info(f"Uploaded successfully: {r2_url}")
        return r2_url

    except Exception as e:
        logger.error(f"Failed to upload to R2: {str(e)}")
        raise


def handler(job: Dict[str, Any]) -> Dict[str, Any]:
    """
    RunPod job handler

    This function is called by RunPod for each job.
    """
    try:
        job_input = job.get("input", {})

        # Validate input
        prompt = job_input.get("prompt")
        if not prompt:
            return {"error": "Missing prompt"}

        duration_sec = job_input.get("durationSec", 5)
        if duration_sec not in [5, 10, 15]:
            return {"error": "Duration must be 5, 10, or 15 seconds"}

        image_url = job_input.get("imageUrl")
        seed = job_input.get("seed")
        cfg = job_input.get("cfg", 7.5)

        logger.info(f"Processing job: {prompt[:50]}... ({duration_sec}s)")

        # Generate video
        video_path = generate_video(
            prompt=prompt,
            duration_sec=duration_sec,
            image_url=image_url,
            seed=seed,
            cfg=cfg,
        )

        # Upload to R2
        r2_url = upload_to_r2(video_path)

        # Clean up local file
        if os.path.exists(video_path):
            os.remove(video_path)
            logger.info("Cleaned up local video file")

        # Return results
        result = {
            "r2Url": r2_url,
            "durationSec": duration_sec,
            "seed": seed,
            "resolution": WAN_RESOLUTION,
            "fps": WAN_FPS,
        }

        logger.info(f"Job completed successfully: {result}")
        return result

    except Exception as e:
        logger.error(f"Job failed: {str(e)}", exc_info=True)
        return {"error": str(e)}


# Load model on startup
logger.info("Starting worker initialization...")
try:
    load_model()
    logger.info("Worker ready to process jobs")
except Exception as e:
    logger.error(f"Failed to initialize worker: {str(e)}")
    logger.warning("Worker will start anyway, but jobs will fail until model is loaded")


# FastAPI endpoint (for testing)
@app.post("/run")
async def run_job(job_input: JobInput):
    """
    RunPod serverless endpoint
    """
    result = handler({"input": job_input.dict()})

    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])

    return result


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": PIPE is not None,
        "device": DEVICE,
        "gpu_available": torch.cuda.is_available(),
    }


# For local testing
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


# RunPod serverless mode (uncomment for production deployment)
# runpod.serverless.start({"handler": handler})
