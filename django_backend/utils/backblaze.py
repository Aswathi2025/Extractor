"""
Backblaze B2 utility — Python port of backblaze.js using boto3.
Provides: upload_to_b2, delete_from_b2, generate_b2_public_url, generate_b2_presigned_url
"""
import time
import logging
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from django.conf import settings

logger = logging.getLogger(__name__)

_b2_client = None


def _get_client():
    global _b2_client
    if _b2_client is None:
        if getattr(settings, 'DEBUG', True) or settings.BACKBLAZE_KEY_ID == 'your_key_id':
            # Mock client for local development
            class MockClient:
                def put_object(self, **kwargs):
                    pass
                def delete_object(self, **kwargs):
                    pass
                def generate_presigned_url(self, *args, **kwargs):
                    return 'http://localhost:5173/mock_resume.pdf'
            _b2_client = MockClient()
        else:
            _b2_client = boto3.client(
                's3',
                endpoint_url=settings.BACKBLAZE_ENDPOINT,
                region_name=settings.BACKBLAZE_REGION,
                aws_access_key_id=settings.BACKBLAZE_KEY_ID,
                aws_secret_access_key=settings.BACKBLAZE_APP_KEY,
                config=Config(signature_version='s3v4'),
            )
    return _b2_client


def upload_to_b2(name: str, buffer: bytes, mimetype: str, custom_key: str = None) -> str:
    """
    Upload a file buffer to Backblaze B2.
    Returns the object key (path) of the uploaded file.
    """
    if not name:
        name = 'file'
    key = custom_key or f'uploads/{int(time.time())}-{name.replace(" ", "_")}'
    client = _get_client()
    client.put_object(
        Bucket=settings.BACKBLAZE_BUCKET_NAME,
        Key=key,
        Body=buffer,
        ContentType=mimetype,
    )
    return key


def delete_from_b2(key: str) -> bool:
    """Delete a file from Backblaze B2 by key."""
    client = _get_client()
    client.delete_object(Bucket=settings.BACKBLAZE_BUCKET_NAME, Key=key)
    return True


def generate_b2_public_url(key: str) -> str:
    """Generate a public URL for a file (bucket must be public)."""
    if getattr(settings, 'DEBUG', True) or settings.BACKBLAZE_KEY_ID == 'your_key_id':
        return 'http://localhost:5173/mock_resume.pdf'
    endpoint = settings.BACKBLAZE_ENDPOINT.rstrip('/')
    bucket = settings.BACKBLAZE_BUCKET_NAME
    return f'{endpoint}/{bucket}/{key}'


def generate_b2_presigned_url(key: str, expires_in: int = 3600) -> str:
    """Generate a pre-signed URL for private bucket access."""
    client = _get_client()
    url = client.generate_presigned_url(
        'get_object',
        Params={'Bucket': settings.BACKBLAZE_BUCKET_NAME, 'Key': key},
        ExpiresIn=expires_in,
    )
    return url
