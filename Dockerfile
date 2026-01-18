FROM node:20-slim

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code and prisma schema
COPY . .

# Generate Prisma client (after copying schema)
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Copy entrypoint and make executable
RUN chmod +x /app/docker/entrypoint.sh

# Create data directory
RUN mkdir -p /app/data

# Expose ports
EXPOSE 3000 3001

ENTRYPOINT ["/app/docker/entrypoint.sh"]
