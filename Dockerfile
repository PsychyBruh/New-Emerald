# Use a Node.js base image
FROM node:20

# Set working directory
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package.json and pnpm-lock.yaml first (for better caching)
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Copy the rest of your app
COPY . .

# Build the project
RUN pnpm build

# Expose both ports
EXPOSE 3000 5613

# Default command: run dev server
CMD ["pnpm", "dev"]
