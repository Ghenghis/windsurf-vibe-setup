# Docker/Containerized Project Rules

## Project Type

This is a containerized application using Docker.

## Tech Stack

- Docker & Docker Compose
- Multi-stage builds
- Container orchestration (optional: K8s)

## Code Standards

### File Structure

```
project/
├── docker/
│   ├── Dockerfile           # Main Dockerfile
│   ├── Dockerfile.dev       # Development Dockerfile
│   └── docker-compose.yml   # Service orchestration
├── src/                     # Application code
├── scripts/
│   ├── entrypoint.sh        # Container entrypoint
│   └── healthcheck.sh       # Health check script
├── .dockerignore            # Files to exclude
└── .env.example             # Environment template
```

### Dockerfile Best Practices

```dockerfile
# Use specific version tags
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy dependency files first (cache optimization)
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Non-root user
USER node

# Health check
HEALTHCHECK --interval=30s CMD curl -f http://localhost:3000/health

EXPOSE 3000
CMD ["node", "dist/index.js"]
```

## Best Practices

- Use multi-stage builds
- Run as non-root user
- Use specific image tags (not `latest`)
- Minimize layer count
- Order instructions by change frequency
- Use .dockerignore
- Add health checks
- Set resource limits

## Docker Compose

- Use named volumes for persistence
- Define networks explicitly
- Use environment files
- Add depends_on with healthchecks
- Configure restart policies

## Security

- Scan images for vulnerabilities
- Don't store secrets in images
- Use Docker secrets or env vars
- Keep base images updated
- Drop unnecessary capabilities

## Don't Do

- No `latest` tags in production
- No secrets in Dockerfile
- No running as root
- No unbounded resource usage
- No hardcoded configuration
