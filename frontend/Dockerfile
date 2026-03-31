FROM node:20-alpine AS builder

WORKDIR /app

# Require git to pull dependencies and native compilation for sharp/swc
RUN apk add --no-cache git python3 make g++ build-base

# Next.js build requires API tracking args at build time
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY package*.json ./
# Using legacy peer deps since the Next.js project may have dependency conflicts
RUN npm install --legacy-peer-deps

COPY . .

# Build Next.js application
RUN npm run build

# Secondary runner image for smaller size
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy necessary output from builder stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next

EXPOSE 3000

CMD ["npm", "start"]
