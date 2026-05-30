# Stage 1: Build the Vite frontend and compile TS server
FROM node:20 AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the application
COPY . .

# Build the frontend and backend (assuming npm run build compiles both, or we can compile just frontend)
# The package.json "build" script runs: tsc -p tsconfig.json && vite build
RUN npm run build

# Stage 2: Production environment
FROM node:20-slim

WORKDIR /app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled frontend assets
COPY --from=builder /app/dist ./dist

# Copy compiled server code
COPY --from=builder /app/server ./server
COPY --from=builder /app/package.json ./package.json

# Install tsx
RUN npm install -g tsx

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["npx", "tsx", "server/index.ts"]
