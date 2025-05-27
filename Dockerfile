# Dockerfile for Crypto-Tracker with MCP Support
FROM node:20-alpine

# Install system dependencies
RUN apk add --no-cache \
        python3 \
        py3-pip \
        curl \
        ca-certificates

# Install uv for Python package management
RUN pip3 install --no-cache-dir --break-system-packages uv

# Set working directory
WORKDIR /workspace

# Copy package files
COPY package*.json ./
COPY svelte.config.js ./
COPY vite.config.js ./
COPY tsconfig.json ./
COPY tailwind.config.js ./

# Install Node.js dependencies
RUN npm ci

# Copy source code
COPY src/ ./src/
COPY static/ ./static/
COPY .env* ./

# Copy MCP configuration
COPY .vscode/mcp.json ./.vscode/mcp.json
COPY mcp-servers/ ./mcp-servers/

# Build the application
RUN npm run build

# Expose port
EXPOSE 5173
EXPOSE 4173

# Start the application
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "4173"]
