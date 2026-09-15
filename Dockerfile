# Multi-stage Dockerfile for Sleeper League Gazette
# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package.json ./
RUN npm install

# Copy source files
COPY . .

# Build Vite frontend and bundled Node server (dist/server.cjs)
RUN npm run build

# Stage 2: Production runtime
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Install curl for Docker healthchecks
RUN apk add --no-cache curl

# Copy package files and install only production dependencies
COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copy built assets and compiled server from builder stage
COPY --from=builder /app/dist ./dist

# Create non-root user for security
RUN addgroup -S nodejs -g 1001 && \
    adduser -S nodeapp -u 1001 -G nodejs && \
    chown -R nodeapp:nodejs /app

USER nodeapp

# Expose default application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the bundled Express production server
CMD ["node", "dist/server.cjs"]
