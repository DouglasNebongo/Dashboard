# 1) Builder stage
FROM node:22-alpine3.18 AS builder

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY prisma ./prisma
ENV NODE_ENV=production
RUN npm ci

# Generate the Prisma client into node_modules/
RUN npx prisma generate
# Copy source and build the Next.js app


COPY . .
# RUN npm run build

RUN --mount=type=secret,id=env \
    set -a && \
    . /run/secrets/env && \
    set +a && \
    npm run build

# 2) Runner stage
FROM node:22-alpine3.18 AS runner

# Create app directory
WORKDIR /app
ENV NODE_ENV=production

# Copy only what's needed from the builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./

# Expose your app port
EXPOSE 3000

# Switch to a non-root user for security
USER node

# Start the Next.js server
CMD ["npm", "run", "start"]

