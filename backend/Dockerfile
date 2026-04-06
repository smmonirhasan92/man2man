# ============================================================
# STAGE 1: Builder
# Installs ALL dependencies (dev + prod) for any build steps
# ============================================================
FROM node:20-slim AS builder
WORKDIR /app

# Required for npm packages that compile native bindings (bcryptjs, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ curl \
    && rm -rf /var/lib/apt/lists/*

# Copy package files first to leverage Docker layer caching
COPY package*.json ./

# Install production dependencies only (no devDependencies in final image)
RUN npm install --omit=dev

# ============================================================
# STAGE 2: Runner (Production-Optimized)
# Only production node_modules + source code
# ============================================================
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV TZ=Asia/Dhaka
# [STANDARDIZED] Backend always runs on PORT 5050 across all environments
ENV PORT=5050

# Install curl for healthcheck + runtime needs
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Copy production node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application source
COPY . .

# Expose standardized backend port
EXPOSE 5050

# Healthcheck — validates API is responding
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:5050/health || exit 1

CMD ["node", "server.js"]
