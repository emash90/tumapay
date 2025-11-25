# Docker Setup Guide

This guide explains how to run the TumaPay application using Docker Compose.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose V2+

## Architecture

The application consists of the following services:

```
┌─────────────────────────────────────────────────────┐
│                  Docker Network                      │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ┌──────────────┐      ┌──────────────┐            │
│  │   Client     │──────▶│   Backend    │            │
│  │  (React)     │      │   (NestJS)   │            │
│  │  Port: 3000  │      │  Port: 4000  │            │
│  └──────────────┘      └───────┬──────┘            │
│                                 │                    │
│                        ┌────────┴────────┐          │
│                        │                 │          │
│                 ┌──────▼─────┐  ┌───────▼──────┐  │
│                 │ PostgreSQL  │  │    Redis     │  │
│                 │ Port: 5432  │  │  Port: 6379  │  │
│                 └─────────────┘  └──────────────┘  │
│                                                      │
│                 ┌──────────────┐                    │
│                 │   PgAdmin    │                    │
│                 │  Port: 5050  │                    │
│                 └──────────────┘                    │
└──────────────────────────────────────────────────────┘
```

## Services

### Frontend (Client)
- **Technology**: React 19 + Vite + TypeScript
- **Port**: 3000 (mapped to container port 80)
- **Nginx**: Serves static files and handles SPA routing
- **Build**: Multi-stage build for optimized production image

### Backend (API)
- **Technology**: NestJS + TypeScript
- **Port**: 4000
- **Features**: REST API, JWT authentication, session management

### Database (PostgreSQL)
- **Version**: 15 Alpine
- **Port**: 5433 (mapped from container port 5432)
- **Persistence**: Named volume `postgres_data`

### Cache (Redis)
- **Version**: 7 Alpine
- **Port**: 6379
- **Persistence**: Named volume `redis_data`
- **Security**: Password-protected

### Database Admin (PgAdmin)
- **Port**: 5050
- **Access**: http://localhost:5050

## Quick Start

### 1. Environment Setup

Create a `.env` file in the project root (copy from `.env.example`):

```bash
cp backend/.env.example .env
```

Update the following environment variables for Docker:

```env
# Backend Configuration
PORT=4000
NODE_ENV=production

# Database (Docker service names)
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=tumapay_user
DB_PASSWORD=tumapay_pass_2024
DB_DATABASE=tumapay_db

# Redis (Docker service names)
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=tumapay_redis_2024

# CORS
CORS_ORIGIN=http://localhost:3000
```

### 2. Build and Start Services

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode (background)
docker-compose up -d --build
```

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000/api/v1
- **API Docs**: http://localhost:4000/api/docs
- **PgAdmin**: http://localhost:5050

### 4. Initial Database Setup

The database will be initialized automatically on first run. Seeders will create:
- Sample users
- Business accounts
- Test wallets

## Docker Commands

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f client
docker-compose logs -f backend
docker-compose logs -f postgres
```

### Stop Services

```bash
# Stop all services (preserves data)
docker-compose stop

# Stop and remove containers (preserves volumes)
docker-compose down

# Stop and remove containers + volumes (DELETES ALL DATA)
docker-compose down -v
```

### Rebuild Services

```bash
# Rebuild a specific service
docker-compose build client
docker-compose build backend

# Rebuild and restart
docker-compose up -d --build client
```

### Execute Commands in Containers

```bash
# Backend shell
docker-compose exec backend sh

# Run database migrations
docker-compose exec backend npm run migration:run

# Run seeders
docker-compose exec backend npm run seed
```

### Database Management

```bash
# Access PostgreSQL CLI
docker-compose exec postgres psql -U tumapay_user -d tumapay_db

# Create database backup
docker-compose exec postgres pg_dump -U tumapay_user tumapay_db > backup.sql

# Restore database
cat backup.sql | docker-compose exec -T postgres psql -U tumapay_user -d tumapay_db
```

## Development vs Production

### Development Mode

For local development with hot-reload:

```bash
# Backend has volume mount for src directory
# Changes to ./backend/src will trigger auto-reload
```

### Production Mode

For production deployment:

1. Remove the volume mount from backend service in `docker-compose.yml`:
   ```yaml
   # Remove this line:
   # - ./backend/src:/app/src
   ```

2. Use production environment variables

3. Enable HTTPS/SSL termination (use reverse proxy like Nginx or Traefik)

## Troubleshooting

### Client Build Fails

```bash
# Clear Docker cache and rebuild
docker-compose build --no-cache client
```

### Backend Cannot Connect to Database

```bash
# Check if postgres is healthy
docker-compose ps

# View postgres logs
docker-compose logs postgres

# Verify environment variables
docker-compose exec backend env | grep DB_
```

### Port Already in Use

```bash
# Find process using the port
lsof -i :3000
lsof -i :4000

# Kill the process or change port mapping in docker-compose.yml
```

### Reset Everything

```bash
# Stop and remove all containers, networks, and volumes
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Start fresh
docker-compose up --build
```

## Health Checks

All services include health checks:

```bash
# Check service health
docker-compose ps

# Services should show "healthy" status
```

## Networking

All services run on a custom bridge network `tumapay_network`. Services can communicate using their service names:

- `client` can reach `backend` at `http://backend:4000`
- `backend` can reach `postgres` at `postgres:5432`
- `backend` can reach `redis` at `redis:6379`

## Volumes

Persistent data is stored in named volumes:

```bash
# List volumes
docker volume ls | grep tumapay

# Inspect volume
docker volume inspect tumapay_postgres_data
docker volume inspect tumapay_redis_data
```

## Security Notes

⚠️ **Important Security Considerations:**

1. **Environment Variables**: Never commit `.env` file to version control
2. **Passwords**: Change default passwords before production
3. **Secrets**: Use Docker secrets or external secret management in production
4. **Networks**: Restrict network access in production
5. **SSL/TLS**: Always use HTTPS in production

## Performance Optimization

### Build Cache

```bash
# Use build cache for faster builds
docker-compose build

# Force rebuild without cache
docker-compose build --no-cache
```

### Resource Limits

Add resource limits in `docker-compose.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
```

## Monitoring

### Container Stats

```bash
# Real-time resource usage
docker stats

# Specific service
docker stats tumapay_backend
```

### Logs

```bash
# Follow logs with timestamps
docker-compose logs -f --timestamps

# Last 100 lines
docker-compose logs --tail=100
```

## Backup and Restore

### Automated Backups

Create a backup script:

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T postgres pg_dump -U tumapay_user tumapay_db > "backup_${DATE}.sql"
```

### Restore from Backup

```bash
cat backup_20250119_120000.sql | docker-compose exec -T postgres psql -U tumapay_user -d tumapay_db
```

## Support

For issues or questions:
- Check logs: `docker-compose logs -f`
- Verify health: `docker-compose ps`
- Restart services: `docker-compose restart`
