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

# Using standard start
CMD ["npm", "start"]
