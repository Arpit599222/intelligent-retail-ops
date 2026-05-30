# Stage 1: Build the Vite frontend and compile TS server
FROM node:20-alpine AS builder

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
FROM node:20-alpine

WORKDIR /app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled frontend assets
COPY --from=builder /app/dist ./dist

# Copy compiled server code (if tsc outputs to a directory, typically dist or server/dist depending on tsconfig)
# Wait, let's verify where `tsc -p tsconfig.json` outputs the files.
# If we run the server using tsx locally, maybe we can run it with tsx in prod or pre-compile it.
# To be safe, we'll install tsx in prod stage or copy the entire server folder and run it with tsx.
# Since tsconfig.json might not output to a specific folder, let's just run it with tsx for simplicity and reliability without changing their build process heavily.

# Let's adjust this: copy everything we need to run it via tsx
COPY --from=builder /app/server ./server
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

# Install tsx
RUN npm install -g tsx

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["npx", "tsx", "server/index.ts"]
