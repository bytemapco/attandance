# ==============================================================================
# Frontend Dockerfile - Smart Attendance System (Next.js 16 Standalone)
# Multi-stage production build running as non-root user
# ==============================================================================

# --- Stage 1: Dependencies ---
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json .npmrc* ./
RUN npm ci

# --- Stage 2: Builder ---
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time environment variables for Next.js public client-side bundling
# Default fallback values can be overridden via docker build --build-arg
ARG NEXT_PUBLIC_API_URL="/api/v1"
ARG NEXT_PUBLIC_WS_URL="/ws/connect"
ARG NEXT_PUBLIC_DEFAULT_TENANT_ID="default-institution"

ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    NEXT_PUBLIC_WS_URL=${NEXT_PUBLIC_WS_URL} \
    NEXT_PUBLIC_DEFAULT_TENANT_ID=${NEXT_PUBLIC_DEFAULT_TENANT_ID} \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production

RUN npm run build

# --- Stage 3: Runner ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME="0.0.0.0" \
    NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set up public folder and static assets from standalone output
COPY --from=builder /app/public ./public

# Copy standalone output (handling root directory structure)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# If server.js is nested inside frontend/ (due to turbopack root or monorepo), launch appropriately
CMD ["sh", "-c", "if [ -f ./server.js ]; then node server.js; elif [ -f ./frontend/server.js ]; then cd frontend && node server.js; else node $(find . -name server.js | head -n 1); fi"]
