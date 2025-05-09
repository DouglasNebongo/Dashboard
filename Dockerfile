# 1) Builder stage
FROM node:22-alpine3.18 AS builder

# Declare build arguments to receive them from the build command
ARG GOOGLE_CLIENT_ID
ARG GOOGLE_CLIENT_SECRET
ARG NEXTAUTH_SECRET 
ARG NEXTAUTH_URL
ARG POSTGRES_PASSWORD
ARG DB_PASSWORD
ARG DATABASE_URL
ARG EMAIL_FROM
ARG EMAIL_SERVER_HOST
ARG EMAIL_SERVER_PASSWORD
ARG EMAIL_SERVER_PORT
ARG EMAIL_SERVER_USER
ARG NEXT_PUBLIC_EXCHANGE_RATE_API_KEY
ARG UPSTASH_REDIS_HOST
ARG UPSTASH_REDIS_PASSWORD
ARG UPSTASH_REDIS_PORT
ARG UPSTASH_REDIS_REST_TOKEN
ARG UPSTASH_REDIS_REST_URL
ARG POSTGRES_URL
ARG SKIP_REDIS_CONNECTION
ARG REDIS_URL


# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY prisma ./prisma
ENV NODE_ENV=production

RUN npm cache clean --force
RUN npm install
RUN npm install --save-dev --force @types/bcrypt @types/nodemailer



# Generate the Prisma client into node_modules/
RUN npx prisma generate


# Copy source and build the Next.js app
COPY . .


ENV REDIS_URL=$REDIS_URL
ENV GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
ENV GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET
ENV UPSTASH_REDIS_REST_URL=$UPSTASH_REDIS_REST_URL 
ENV UPSTASH_REDIS_REST_TOKEN=$UPSTASH_REDIS_REST_TOKEN 
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET 
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV POSTGRES_PASSWORD=$POSTGRES_PASSWORD
ENV DB_PASSWORD=$DB_PASSWORD
ENV DATABASE_URL=$DATABASE_URL
ENV EMAIL_FROM=$EMAIL_FROM
ENV EMAIL_SERVER_HOST=$EMAIL_SERVER_HOST
ENV EMAIL_SERVER_PASSWORD=$EMAIL_SERVER_PASSWORD
ENV EMAIL_SERVER_PORT=$EMAIL_SERVER_PORT
ENV EMAIL_SERVER_USER=$EMAIL_SERVER_USER
ENV NEXT_PUBLIC_EXCHANGE_RATE_API_KEY=$NEXT_PUBLIC_EXCHANGE_RATE_API_KEY
ENV UPSTASH_REDIS_HOST=$UPSTASH_REDIS_HOST
ENV UPSTASH_REDIS_PASSWORD=$UPSTASH_REDIS_PASSWORD
ENV UPSTASH_REDIS_PORT=$UPSTASH_REDIS_PORT
ENV POSTGRES_URL=$POSTGRES_URL
ENV SKIP_REDIS_CONNECTION=$SKIP_REDIS_CONNECTION


RUN npx tsc --project app/worker/tsconfig.worker.json


RUN npm run build

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
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/app/worker/dist ./dist
# Expose your app port
EXPOSE 3000

# Switch to a non-root user for security
USER node

# Start the Next.js server
CMD ["npm", "run", "start"]