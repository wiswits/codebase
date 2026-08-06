FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY ../packages/shared /app/packages/shared

# Install dependencies
RUN npm ci

# Copy source
COPY . .

# Build
RUN npm run build

# Production image
FROM node:20-alpine AS production

WORKDIR /app

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/packages/shared/dist ./packages/shared

# Install production dependencies only
RUN npm ci --only=production

# Expose port
EXPOSE 4000

# Start server
CMD ["node", "dist/index.js"]