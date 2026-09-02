# ==============================================================================
# Multi-Stage Production Dockerfile for Smart Billing ERP Frontend
# ==============================================================================

# --- Stage 1: Build Static Bundle ---
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . ./
RUN npm run build

# --- Stage 2: Serve with Lightweight Nginx ---
FROM nginx:alpine AS runner

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
