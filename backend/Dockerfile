FROM node:20-alpine

WORKDIR /app

# Required for npm dependencies fetching from git repositories or simple-git usage
RUN apk add --no-cache git

# Copy package info first to leverage Docker layer caching
COPY package*.json ./

# Install dependencies for production (ignores devDependencies)
# We avoid caching node_modules so we get a clean slate
RUN npm install --omit=dev

# Copy backend source code
COPY . .

# Listen on PORT
EXPOSE 5050

# Using standard start
CMD ["npm", "start"]
