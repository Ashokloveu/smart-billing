# ==============================================================================
# Multi-Stage Production Dockerfile for Smart Billing ERP Backend
# ==============================================================================

# --- Stage 1: Build Stage ---
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy TypeScript source and build
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# --- Stage 2: Production Runtime ---
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built code from builder
COPY --from=builder /app/dist ./dist

# Run as non-root user
USER node

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/healthz || exit 1

CMD ["node", "dist/server.js"]
