FROM node:20-alpine

WORKDIR /app

# Copy all package files first for better caching
COPY package.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/

# Install dependencies (root has no deps, just scripts)
RUN cd server && npm install && cd ../client && npm install

# Copy source code
COPY . .

# Build the client
RUN cd client && npm run build

# Don't run as root
RUN chown -R node:node /app
USER node

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "server/index.js"]
