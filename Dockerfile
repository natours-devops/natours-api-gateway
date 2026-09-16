FROM node:22-alpine

WORKDIR /app

# Copy dependency files first for better layer caching
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Run as non-root user
USER node

# Copy application source
COPY --chown=node:node . . 

# Set production environment
ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "server.js"]