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
        is_placeholder = (
            not settings.BACKBLAZE_KEY_ID
            or settings.BACKBLAZE_KEY_ID == '005ec6ab736d49700000000029'
            or not settings.BACKBLAZE_APP_KEY
            or settings.BACKBLAZE_APP_KEY == 'K005lCZkbVkGZyCKQZJPRCZdHavJ4I4'
        )
        if is_placeholder:
            # Mock client — saves to local MEDIA_ROOT when no real credentials are configured
            import os
            class MockClient:
                def put_object(self, **kwargs):
                    key = kwargs.get('Key')
                    buffer = kwargs.get('Body')
                    file_path = os.path.join(settings.MEDIA_ROOT, key)
                    os.makedirs(os.path.dirname(file_path), exist_ok=True)
                    with open(file_path, 'wb') as f:
                        f.write(buffer)

                def delete_object(self, **kwargs):
                    key = kwargs.get('Key')
                    file_path = os.path.join(settings.MEDIA_ROOT, key)
                    if os.path.exists(file_path):
                        os.remove(file_path)

                def generate_presigned_url(self, *args, **kwargs):
                    params = kwargs.get('Params', {})
                    key = params.get('Key', '')
                    file_path = os.path.join(settings.MEDIA_ROOT, key)
                    if not os.path.exists(file_path):
                        return None
                    return f"http://localhost:5000{settings.MEDIA_URL}{key}"
            
            _b2_client = MockClient()
        else:
            _b2_client = boto3.client(
                's3',
                endpoint_url=f'https://{settings.BACKBLAZE_ENDPOINT}' if not settings.BACKBLAZE_ENDPOINT.startswith('http') else settings.BACKBLAZE_ENDPOINT,
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
    is_placeholder = (
        not settings.BACKBLAZE_KEY_ID
        or settings.BACKBLAZE_KEY_ID == '005ec6ab736d49700000000029'
        or not settings.BACKBLAZE_APP_KEY
        or settings.BACKBLAZE_APP_KEY == 'K005lCZkbVkGZyCKQZJPRCZdHavJ4I4'
    )
    if is_placeholder:
        return f"http://localhost:5000{settings.MEDIA_URL}{key}"
    endpoint = settings.BACKBLAZE_ENDPOINT.rstrip('/')
    if not endpoint.startswith('http'):
        endpoint = f'https://{endpoint}'
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
