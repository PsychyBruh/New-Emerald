# --- Build Stage ---
# Use a specific Node.js LTS version on Alpine for a small base
FROM node:20-alpine AS builder

# Set the working directory
WORKDIR /app

# Install pnpm (since pnpm-lock.yaml is present in the repo)
RUN npm install -g pnpm

# Copy package.json and the pnpm lockfile
COPY package.json pnpm-lock.yaml ./

# Install ALL dependencies (dev and production) needed for the build
RUN pnpm install --frozen-lockfile

# Copy the rest of the application source code
COPY . .

# Run the build script (defined in package.json)
# This should build the Vite static files (into /dist)
# and compile your server.ts (e.g., into /dist/server.js or /server.js)
RUN pnpm build

# --- Production Stage ---
# Start from a fresh, slim Node.js image
FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package.json and the pnpm lockfile
COPY package.json pnpm-lock.yaml ./

# Install ONLY production dependencies
RUN pnpm install --prod --frozen-lockfile

# Copy the built application artifacts from the 'builder' stage
# This assumes your 'pnpm build' script outputs the client to a 'dist' folder
COPY --from=builder /app/dist ./dist

# Copy the compiled server file from the builder's root directory
# This assumes 'pnpm build' compiles server.ts to server.js in the root
COPY --from=builder /app/server.js ./server.js

# Your server.ts likely serves static files from a directory.
# If 'pnpm build' doesn't move 'public' into 'dist', you may need this line:
# COPY --from=builder /app/public ./public

# Your server.ts will listen on a port.
# 3000 is a common default. Change this if your server uses a different one.
EXPOSE 3000

# This is the most reliable way to start your app.
# It directly runs the compiled server file from the root.
CMD ["node", "server.js"]