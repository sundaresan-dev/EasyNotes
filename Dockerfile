# ============================================
# Stage 1: Build dependencies (native modules)
# ============================================
FROM node:20-alpine AS builder

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY backend/package*.json ./

RUN npm ci --only=production && npm cache clean --force

# ============================================
# Stage 2: Production image
# ============================================
FROM node:20-alpine AS production

LABEL maintainer="ulu"
LABEL description="EasyNotes Application"
LABEL version="1.0.0"

RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

WORKDIR /app

# Copy built node_modules
COPY --from=builder /app/node_modules ./backend/node_modules

# Copy application source
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Create data directory for SQLite
RUN mkdir -p /app/data && chown -R appuser:appgroup /app

USER appuser

VOLUME ["/app/data"]

ENV NODE_ENV=production
ENV PORT=8080
ENV DB_TYPE=sqlite
ENV DB_DIR=/app/data

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

CMD ["node", "backend/server.js"]
