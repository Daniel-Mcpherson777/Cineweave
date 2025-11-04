import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from typing import Optional
from config import get_settings

settings = get_settings()


class R2Client:
    """Client for Cloudflare R2 operations"""

    def __init__(self):
        self.client = boto3.client(
            's3',
            endpoint_url=settings.r2_endpoint_url,
            aws_access_key_id=settings.r2_access_key_id,
            aws_secret_access_key=settings.r2_secret_access_key,
            config=Config(signature_version='s3v4'),
            region_name='auto',
        )
        self.bucket = settings.r2_bucket
        self.public_domain = settings.r2_public_domain

    def generate_presigned_url(self, key: str, expiration: int = 86400) -> str:
        """
        Generate a presigned URL for downloading a file from R2

        Args:
            key: Object key in R2
            expiration: URL expiration time in seconds (default 24 hours)

        Returns:
            Presigned URL string
        """
        try:
            url = self.client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': self.bucket,
                    'Key': key,
                },
                ExpiresIn=expiration
            )
            return url
        except ClientError as e:
            raise Exception(f"Failed to generate presigned URL: {str(e)}")

    def get_public_url(self, key: str) -> str:
        """
        Get public URL for an R2 object (if bucket is public)

        Args:
            key: Object key in R2

        Returns:
            Public URL string
        """
        return f"{self.public_domain}/{key}"

    async def upload_file(self, file_path: str, key: str, content_type: str = "video/mp4") -> str:
        """
        Upload a file to R2

        Args:
            file_path: Local file path to upload
            key: Destination key in R2
            content_type: MIME type of the file

        Returns:
            Object key
        """
        try:
            self.client.upload_file(
                file_path,
                self.bucket,
                key,
                ExtraArgs={'ContentType': content_type}
            )
            return key
        except ClientError as e:
            raise Exception(f"Failed to upload to R2: {str(e)}")

    def delete_object(self, key: str) -> bool:
        """
        Delete an object from R2

        Args:
            key: Object key to delete

        Returns:
            True if successful
        """
        try:
            self.client.delete_object(Bucket=self.bucket, Key=key)
            return True
        except ClientError as e:
            raise Exception(f"Failed to delete from R2: {str(e)}")

    def check_object_exists(self, key: str) -> bool:
        """
        Check if an object exists in R2

        Args:
            key: Object key to check

        Returns:
            True if exists, False otherwise
        """
        try:
            self.client.head_object(Bucket=self.bucket, Key=key)
            return True
        except ClientError:
            return False


# Singleton instance
r2_client = R2Client()
