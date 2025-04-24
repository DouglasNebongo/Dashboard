# 1) Builder stage
FROM node:20-alpine3.18 AS builder

# Set working directory
WORKDIR /app

# Install only prod deps, reproducibly
COPY package.json package-lock.json ./
ENV NODE_ENV=production
RUN npm ci

# Copy source
COPY . .

# (Optional) If you have a build step, e.g. for TypeScript or bundlers:
# RUN npm run build

# 2) Runner stage
FROM node:20-alpine3.18 AS runner

# Create app directory
WORKDIR /app

# Copy only what's needed from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app ./

# Switch to a non-root user
USER node

# Expose your app port
EXPOSE 3000

# Metadata labels (optional but recommended)
LABEL org.opencontainers.image.source="https://github.com/your/repo"
LABEL org.opencontainers.image.license="MIT"

# Launch
CMD ["node", "server.js"]

