import mimetypes
import os
import uuid
from typing import Optional
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from fastapi import UploadFile

from app.core.config import settings
from app.core.logging_config import get_logger

logger = get_logger("app.s3")


class S3Service:
    def __init__(self) -> None:
        self.bucket_name = settings.resolved_s3_bucket
        self.region_name = settings.resolved_aws_region
        raw_endpoint = settings.AWS_ENDPOINT_URL
        self.endpoint_url: Optional[str] = raw_endpoint.strip() if (raw_endpoint and raw_endpoint.strip()) else None

        client_kwargs = {
            "service_name": "s3",
            "region_name": self.region_name,
        }
        if settings.AWS_ACCESS_KEY_ID:
            client_kwargs["aws_access_key_id"] = settings.AWS_ACCESS_KEY_ID
        if settings.AWS_SECRET_ACCESS_KEY:
            client_kwargs["aws_secret_access_key"] = settings.AWS_SECRET_ACCESS_KEY
        if self.endpoint_url:
            client_kwargs["endpoint_url"] = self.endpoint_url
            client_kwargs["config"] = Config(s3={"addressing_style": "path"})

        self.client = boto3.client(**client_kwargs)

    def ensure_bucket_exists(self) -> None:
        if not self.bucket_name:
            logger.warning("No S3 bucket configured; skipping bucket verification.")
            return

        try:
            self.client.head_bucket(Bucket=self.bucket_name)
            logger.info("S3 Bucket '%s' verified.", self.bucket_name)
        except ClientError as exc:
            error_code = str(exc.response.get("Error", {}).get("Code", ""))
            # If 403 Forbidden on head_bucket, bucket exists but HEAD permission is restricted
            if error_code in ("403", "AccessDenied"):
                logger.info("S3 Bucket '%s' exists (head_bucket access restricted).", self.bucket_name)
                return

            try:
                if self.region_name == "us-east-1":
                    self.client.create_bucket(Bucket=self.bucket_name)
                else:
                    self.client.create_bucket(
                        Bucket=self.bucket_name,
                        CreateBucketConfiguration={"LocationConstraint": self.region_name},
                    )
                logger.info("S3 Bucket '%s' created successfully.", self.bucket_name)
            except Exception as create_exc:
                logger.warning(
                    "Could not auto-create S3 bucket '%s': %s. Assuming external provisioning.",
                    self.bucket_name,
                    create_exc,
                )

    def upload_bytes(
        self,
        file_bytes: bytes,
        key: str,
        content_type: str = "application/octet-stream",
    ) -> str:
        self.client.put_object(
            Bucket=self.bucket_name,
            Key=key,
            Body=file_bytes,
            ContentType=content_type,
        )
        return self.get_file_url(key)

    async def upload_uploadfile(
        self,
        upload_file: UploadFile,
        folder: str,
        tenant_id: Optional[str] = None,
    ) -> tuple[str, str, bytes]:
        contents = await upload_file.read()
        await upload_file.seek(0)
        ext = (
            os.path.splitext(upload_file.filename)[1].lower()
            if upload_file.filename
            else (mimetypes.guess_extension(upload_file.content_type or "") or ".jpg")
        )
        if ext == ".jpe":
            ext = ".jpg"
        if not ext:
            ext = ".jpg"

        effective_tenant = tenant_id
        if not effective_tenant:
            try:
                from app.middleware.tenant import get_current_tenant_id

                effective_tenant = get_current_tenant_id()
            except Exception:
                effective_tenant = None

        if effective_tenant and effective_tenant != "default-institution":
            key = f"tenants/{effective_tenant}/{folder}/{uuid.uuid4()}{ext}"
        else:
            key = f"{folder}/{uuid.uuid4()}{ext}"

        content_type = (
            upload_file.content_type
            or mimetypes.guess_type(upload_file.filename or "")[0]
            or "application/octet-stream"
        )
        url = self.upload_bytes(contents, key, content_type=content_type)
        return key, url, contents

    def download_bytes(self, key_or_url: str) -> bytes:
        key = self._extract_key(key_or_url)
        response = self.client.get_object(Bucket=self.bucket_name, Key=key)
        return response["Body"].read()

    def delete_file(self, key_or_url: str) -> bool:
        if not key_or_url:
            return False
        try:
            key = self._extract_key(key_or_url)
            self.client.delete_object(Bucket=self.bucket_name, Key=key)
            return True
        except Exception as exc:
            logger.warning("Failed to delete S3 object '%s': %s", key_or_url, exc)
            return False

    def get_file_url(self, key: str) -> str:
        if self.endpoint_url:
            clean_endpoint = self.endpoint_url.rstrip("/")
            return f"{clean_endpoint}/{self.bucket_name}/{key}"
        return f"https://{self.bucket_name}.s3.{self.region_name}.amazonaws.com/{key}"

    def generate_presigned_url(
        self,
        key_or_url: Optional[str],
        expires_in: int = 3600,
        response_content_disposition: Optional[str] = None,
    ) -> Optional[str]:
        if not key_or_url:
            return None
        if not self.bucket_name:
            return key_or_url
        try:
            key = self._extract_key(key_or_url)
            params = {
                "Bucket": self.bucket_name,
                "Key": key,
            }
            if response_content_disposition:
                params["ResponseContentDisposition"] = response_content_disposition
            url = self.client.generate_presigned_url(
                ClientMethod="get_object",
                Params=params,
                ExpiresIn=expires_in,
            )
            return url
        except Exception as exc:
            logger.warning("Failed to generate presigned S3 URL for '%s': %s", key_or_url, exc)
            return key_or_url

    def _extract_key(self, key_or_url: str) -> str:
        if not (key_or_url.startswith("http://") or key_or_url.startswith("https://")):
            return key_or_url.lstrip("/")

        if self.endpoint_url:
            prefix = f"{self.endpoint_url.rstrip('/')}/{self.bucket_name}/"
            if key_or_url.startswith(prefix):
                return key_or_url[len(prefix) :]

        s3_prefix = f"https://{self.bucket_name}.s3.{self.region_name}.amazonaws.com/"
        if key_or_url.startswith(s3_prefix):
            return key_or_url[len(s3_prefix) :]

        parts = key_or_url.split(f"/{self.bucket_name}/")
        if len(parts) > 1:
            return parts[1]

        return key_or_url.lstrip("/")


s3_service = S3Service()
