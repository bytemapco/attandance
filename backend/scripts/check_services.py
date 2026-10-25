#!/usr/bin/env python3
"""
Service Health & Connectivity Checker
Checks AWS S3 and PostgreSQL RDS connectivity using .env / .env.prod configuration.
"""

import os
import socket
import boto3
from botocore.exceptions import ClientError
from dotenv import load_dotenv

# Load active environment file
env_file = os.getenv("ENV_FILE", ".env.prod" if os.path.exists(".env.prod") else ".env")
if os.path.exists(env_file):
    load_dotenv(env_file)
    print(f"Loaded environment from: {env_file}\n")
else:
    load_dotenv()
    print("Loaded default environment (.env)\n")


def check_s3() -> bool:
    print("=" * 60)
    print("1. CHECKING AWS S3 OBJECT STORAGE")
    print("=" * 60)

    bucket_name = os.getenv("AWS_S3_BUCKET_NAME") or os.getenv("S3_BUCKET_NAME", "")
    region_name = os.getenv("AWS_REGION") or os.getenv("AWS_DEFAULT_REGION", "")
    access_key = os.getenv("AWS_ACCESS_KEY_ID", "")
    secret_key = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    endpoint_url = os.getenv("AWS_ENDPOINT_URL") or None

    print(f"• Bucket: {bucket_name or 'Not set'}")
    print(f"• Region: {region_name or 'Not set'}")
    print(f"• Endpoint: {endpoint_url or 'Native AWS S3'}")

    if not bucket_name:
        print("❌ S3 Bucket name is not configured (AWS_S3_BUCKET_NAME or S3_BUCKET_NAME).")
        return False

    if not access_key or not secret_key:
        print("❌ AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY is missing.")
        return False

    try:
        client_kwargs = {
            "service_name": "s3",
            "region_name": region_name,
            "aws_access_key_id": access_key,
            "aws_secret_access_key": secret_key,
        }
        if endpoint_url and endpoint_url.strip():
            client_kwargs["endpoint_url"] = endpoint_url.strip()

        s3 = boto3.client(**client_kwargs)
        s3.head_bucket(Bucket=bucket_name)
        print("✅ S3 Bucket verified (head_bucket OK)")

        # Test write / read / delete
        test_key = "__healthcheck_probe.txt"
        s3.put_object(Bucket=bucket_name, Key=test_key, Body=b"ok")
        obj = s3.get_object(Bucket=bucket_name, Key=test_key)
        data = obj["Body"].read()
        s3.delete_object(Bucket=bucket_name, Key=test_key)

        print(f"✅ S3 Read/Write/Delete probe passed (data: {data.decode()})")
        print("🎉 S3 IS FULLY FUNCTIONAL!\n")
        return True
    except ClientError as e:
        print(f"❌ S3 ClientError: {e}\n")
        return False
    except Exception as e:
        print(f"❌ S3 Error: {e}\n")
        return False


def check_rds() -> bool:
    print("=" * 60)
    print("2. CHECKING AWS RDS POSTGRESQL CONNECTIVITY")
    print("=" * 60)

    db_url = os.getenv("DATABASE_URL", "")
    print(f"• Raw DATABASE_URL: {db_url}")

    if not db_url:
        print("❌ DATABASE_URL is not set in environment.")
        return False

    host = ""
    port = 5432

    # Parse host from DATABASE_URL
    if "@" in db_url:
        try:
            authority = db_url.split("@")[1].split("/")[0]
            if ":" in authority:
                host, port_str = authority.split(":")
                port = int(port_str)
            else:
                host = authority
        except Exception as parse_err:
            print(f"❌ Failed to parse host/port from DATABASE_URL: {parse_err}")
            return False

    if not host:
        print("❌ Could not extract host from DATABASE_URL.")
        return False

    print(f"• Target Host: {host}")
    print(f"• Target Port: {port}")

    # DNS Resolution
    print("\n[Step 1] Resolving DNS...")
    try:
        resolved_ip = socket.gethostbyname(host)
        print(f"• Resolved IP: {resolved_ip}")
        if resolved_ip.startswith("172.") or resolved_ip.startswith("10.") or resolved_ip.startswith("192.168."):
            print("⚠️ NOTE: Resolved IP is a PRIVATE AWS VPC IP (172.x.x.x / RFC 1918).")
            print("   This means the RDS instance is NOT publicly accessible from outside its VPC.")
    except Exception as e:
        print(f"❌ DNS Resolution Failed: {e}")
        return False

    # TCP Port Connectivity
    print("\n[Step 2] Testing TCP Connection on Port 5432 (5s timeout)...")
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(5)
    try:
        sock.connect((host, port))
        sock.close()
        print("✅ TCP Port 5432 is OPEN and REACHABLE!\n")
        return True
    except socket.timeout:
        print("❌ TCP Connection TIMED OUT:")
        print("   • Root Cause 1: In AWS RDS Console, 'Publicly Accessible' is set to 'No'.")
        print("   • Root Cause 2: RDS VPC Security Group does not allow Inbound Port 5432.\n")
        return False
    except Exception as e:
        print(f"❌ TCP Connection Failed: {e}\n")
        return False


def check_ai_hardware() -> bool:
    print("=" * 60)
    print("3. CHECKING AI COMPUTE HARDWARE (GPU / CPU)")
    print("=" * 60)
    try:
        import sys

        backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
        if backend_dir not in sys.path:
            sys.path.insert(0, backend_dir)
        from app.core.hardware import hardware_manager

        status = hardware_manager.initialize()
        print(f"• Active Device: {status['active_device']} ({status['device_type']})")
        print(f"• Target Device: {status['target_device']}")
        print(f"• Memory Growth: {'Enabled' if status['memory_growth_enabled'] else 'N/A'}")
        print(f"• Fallback Triggered: {status['fallback_occurred']}")
        print(f"✅ AI Hardware subsystem verified ({status['device_type']} Mode)\n")
        return True
    except Exception as exc:
        print(f"❌ AI Hardware check failed: {exc}\n")
        return False


if __name__ == "__main__":
    s3_ok = check_s3()
    rds_ok = check_rds()
    ai_ok = check_ai_hardware()

    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"AWS S3:      {'✅ PASS' if s3_ok else '❌ FAIL'}")
    print(f"AWS RDS:     {'✅ PASS' if rds_ok else '❌ FAIL (Needs Public Access & Inbound Rule in AWS Console)'}")
    print(f"AI HARDWARE: {'✅ PASS' if ai_ok else '❌ FAIL'}")
    print("=" * 60)
