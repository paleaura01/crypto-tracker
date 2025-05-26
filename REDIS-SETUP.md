# Redis Setup for MCP (Optional)

## Why Redis was removed temporarily
The Redis MCP server was causing connection failures because Redis isn't currently running on your system. This is completely optional for your crypto-tracker project.

## If you want to add Redis back later:

### Install Redis on Windows
```bash
# Option 1: Using Chocolatey
choco install redis-64

# Option 2: Using winget
winget install Redis.Redis

# Option 3: Manual download
# Download from: https://github.com/tporadowski/redis/releases
```

### Start Redis Server
```bash
# Start Redis server (default port 6379)
redis-server

# Or as Windows service
redis-server --service-install
redis-server --service-start
```

### Test Redis Connection
```bash
# Test if Redis is running
redis-cli ping
# Should return: PONG
```

### Add back to MCP config
Once Redis is running, you can add this back to your `mcp.json`:

```json
"redis": {
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-redis",
    "redis://localhost:6379"
  ]
}
```

## Benefits of Redis for Crypto Tracker
- **Fast caching** of price data
- **Session storage** for user preferences  
- **Rate limiting** for API calls
- **Real-time data** pubsub for price updates

## Current Status: Not Required
Your crypto-tracker works perfectly without Redis. It's an optional enhancement for advanced caching scenarios.
