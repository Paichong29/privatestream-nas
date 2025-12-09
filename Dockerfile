FROM node:18-alpine

WORKDIR /app

# Install dependencies first for caching
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Create data directory with correct permissions
RUN mkdir -p data uploads logs backups && chown -R node:node /app

# Switch to non-root user
USER node

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/stats || exit 1

EXPOSE 3001

CMD ["node", "server.js"]
