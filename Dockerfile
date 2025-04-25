# 1) Builder stage
FROM node:22-alpine3.18 AS builder

# Declare build arguments to receive them from the build command
ARG GOOGLE_CLIENT_ID
ARG GOOGLE_CLIENT_SECRET
ARG UPSTASH_REDIS_REST_URL # Add this
ARG UPSTASH_REDIS_REST_TOKEN # Add this
ARG NEXTAUTH_SECRET # Add this
ARG NEXTAUTH_URL # Add this

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

# Make build arguments available as environment variables for the build command (npm run build)
ENV GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
ENV GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET
ENV UPSTASH_REDIS_REST_URL=$UPSTASH_REDIS_REST_URL 
ENV UPSTASH_REDIS_REST_TOKEN=$UPSTASH_REDIS_REST_TOKEN 
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET 
ENV NEXTAUTH_URL=$NEXTAUTH_URL


RUN npm run build

# 2) Runner stage
# ... (rest of your runner stage remains the same)
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