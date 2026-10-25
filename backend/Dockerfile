# ==============================================================================
# Backend Dockerfile - Smart Attendance System (FastAPI)
# Multi-stage production build running as non-root user
# ==============================================================================

# --- Stage 1: Build & Python Dependencies ---
FROM python:3.11-slim AS builder

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    git \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /install

COPY requirements.txt .
RUN pip install --prefix=/install/wheels -r requirements.txt

# --- Stage 2: Production Runner ---
FROM python:3.11-slim AS runner

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH="/app:${PYTHONPATH}"

# Install minimal runtime libraries for OpenCV, GLib, and healthcheck curl
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Create dedicated non-root application user
RUN groupadd --system --gid 1001 appgroup && \
    useradd --system --uid 1001 --gid appgroup --create-home --home-dir /home/appuser appuser

WORKDIR /app

# Copy python dependencies from builder
COPY --from=builder /install/wheels /usr/local

# Copy application source code
COPY --chown=appuser:appgroup . .

# Generate Prisma Client Python inside container environment
# prisma generate uses prisma/schema.prisma
RUN python -m prisma generate

# Create directory for DeepFace / model caches with proper permissions
RUN mkdir -p /home/appuser/.deepface/weights /app/models && \
    chown -R appuser:appgroup /home/appuser /app

USER appuser

EXPOSE 8000

# Health check using FastAPI /health endpoint
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2", "--proxy-headers", "--forwarded-allow-ips", "*"]
