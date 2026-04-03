FROM node:20
WORKDIR /app

# Using standard debian node image avoids alpine compatibility issues with native node-gyp bindings
# No need for apk add since git, python3, g++, make are included in standard image

# Copy package info first to leverage Docker layer caching
COPY package*.json ./

# Install dependencies for production (ignores devDependencies)
# We avoid caching node_modules so we get a clean slate
RUN npm install --omit=dev

# Copy backend source code
COPY . .

# Listen on PORT
EXPOSE 5050

# Healthcheck to ensure the container is ready
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5050/health', (res) => res.statusCode === 200 ? process.exit(0) : process.exit(1))" || exit 1

# Using standard start
CMD ["npm", "start"]
