FROM node:20-alpine

WORKDIR /app

# Copy root and subpackage files
COPY package.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies
RUN npm run install:all

# Copy source files
COPY server ./server
COPY client ./client

# Build client bundle
RUN npm run build

EXPOSE 5000

ENV PORT=5000
ENV NODE_ENV=production

CMD ["npm", "start"]
