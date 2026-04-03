FROM node:20 AS builder
WORKDIR /app

# Using standard debian node image avoids alpine compatibility issues with sharp/swc
# Git, python3, g++, make are included in standard image out of the box.

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
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy necessary output from builder stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next

EXPOSE 3000

# Healthcheck to ensure frontend is serving pages
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/', (res) => res.statusCode === 200 ? process.exit(0) : process.exit(1))" || exit 1

CMD ["npm", "start"]
