FROM node:20-alpine

WORKDIR /app

# Install root dependencies
COPY package.json ./
RUN npm install

# Install server dependencies
COPY server/package.json ./server/
RUN cd server && npm install

# Install client dependencies and build
COPY client/package.json ./client/
RUN cd client && npm install

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

# Use entrypoint script to seed on first run, then start
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
ENTRYPOINT ["/docker-entrypoint.sh"]
