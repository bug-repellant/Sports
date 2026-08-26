FROM node:20-alpine

WORKDIR /app

# Copy root package files
COPY package.json ./

# Copy server and client package files
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install server dependencies
RUN npm install --prefix server

# Install client dependencies
RUN npm install --prefix client

# Copy all source files
COPY . .

# Build the React frontend
RUN npm install --prefix client && npm run build --prefix client

EXPOSE 5000

ENV PORT=5000
ENV NODE_ENV=production

CMD ["node", "server/index.js"]
