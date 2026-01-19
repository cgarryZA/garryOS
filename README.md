# HomeOS

A modern, intelligent home automation platform that brings all your smart home devices together in one unified, easy-to-use system.

## Overview

HomeOS is a comprehensive home automation platform designed to integrate various smart home devices, provide intelligent automation, and offer a seamless user experience. Built with a modern tech stack, HomeOS combines the power of FastAPI backend with a React frontend, backed by PostgreSQL and Redis for robust data management and caching.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         HomeOS Platform                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐         ┌──────────────┐                  │
│  │   Frontend   │────────▶│   Backend    │                  │
│  │   (React)    │         │   (FastAPI)  │                  │
│  │  Port: 3000  │◀────────│  Port: 8000  │                  │
│  └──────────────┘         └───────┬──────┘                  │
│                                    │                          │
│                           ┌────────┴────────┐                │
│                           │                 │                │
│                    ┌──────▼──────┐   ┌─────▼─────┐          │
│                    │  PostgreSQL │   │   Redis   │          │
│                    │  Port: 5432 │   │ Port: 6379│          │
│                    └─────────────┘   └───────────┘          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Features

- **Unified Device Management**: Control all your smart home devices from a single interface
- **Intelligent Automation**: Create custom automation rules and schedules
- **Real-time Updates**: WebSocket support for instant device status updates
- **Secure**: Built-in authentication and authorization
- **Scalable**: Microservices architecture with Docker containerization
- **Developer Friendly**: Well-documented API and modular codebase

## Prerequisites

Before you begin, ensure you have the following installed:

- **Docker** (version 20.10 or higher)
- **Docker Compose** (version 2.0 or higher)
- **Git** (for cloning the repository)

### Installing Docker

- **Linux**: Follow the [official Docker installation guide](https://docs.docker.com/engine/install/)
- **macOS**: Download [Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac-install/)
- **Windows**: Download [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/)

Verify your installation:
```bash
docker --version
docker-compose --version
```

## Quick Start

Get HomeOS up and running in minutes:

```bash
# Clone the repository
git clone https://github.com/yourusername/garryOS.git
cd garryOS

# Copy environment variables
cp .env.example .env

# Start all services
./scripts/start-dev.sh
```

That's it! HomeOS will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## Development Setup

### 1. Environment Configuration

Copy the example environment file and customize as needed:

```bash
cp .env.example .env
```

Edit `.env` to configure:
- Database credentials
- Redis connection
- API secrets
- CORS origins

### 2. Starting Services

#### Using the convenience script:
```bash
./scripts/start-dev.sh
```

#### Or manually with docker-compose:
```bash
cd infra
docker-compose up -d
```

#### View logs:
```bash
cd infra
docker-compose logs -f
```

#### Stop services:
```bash
cd infra
docker-compose down
```

### 3. Database Management

#### Run migrations:
```bash
docker exec -it homeos-backend alembic upgrade head
```

#### Reset database (WARNING: This will delete all data):
```bash
./scripts/reset-db.sh
```

#### Create a new migration:
```bash
docker exec -it homeos-backend alembic revision --autogenerate -m "Description"
```

### 4. Accessing Services

Once all containers are running, you can access:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs (Swagger)**: http://localhost:8000/docs
- **API Docs (ReDoc)**: http://localhost:8000/redoc
- **PostgreSQL**: localhost:5432 (credentials in `.env`)
- **Redis**: localhost:6379

## Project Structure

```
garryOS/
├── backend/                 # FastAPI backend application
│   ├── app/
│   │   ├── api/            # API routes and endpoints
│   │   ├── core/           # Core functionality (config, security)
│   │   ├── models/         # Database models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   └── main.py         # Application entry point
│   ├── tests/              # Backend tests
│   ├── alembic/            # Database migrations
│   ├── Dockerfile          # Backend container definition
│   └── requirements.txt    # Python dependencies
│
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── hooks/          # Custom React hooks
│   │   ├── utils/          # Utility functions
│   │   └── App.js          # Main application component
│   ├── public/             # Static files
│   ├── Dockerfile          # Frontend container definition
│   └── package.json        # Node dependencies
│
├── infra/                  # Infrastructure configuration
│   └── docker-compose.yml  # Docker services definition
│
├── scripts/                # Utility scripts
│   ├── start-dev.sh        # Start development environment
│   └── reset-db.sh         # Reset database
│
├── .env.example            # Example environment variables
├── .gitignore              # Git ignore rules
└── README.md               # This file
```

## API Documentation

### Interactive API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

- `GET /api/v1/devices` - List all devices
- `POST /api/v1/devices` - Register a new device
- `GET /api/v1/devices/{id}` - Get device details
- `PUT /api/v1/devices/{id}` - Update device
- `DELETE /api/v1/devices/{id}` - Remove device
- `POST /api/v1/automations` - Create automation rule
- `GET /api/v1/automations` - List automation rules

## Testing

### Backend Tests

```bash
# Run all tests
docker exec -it homeos-backend pytest

# Run with coverage
docker exec -it homeos-backend pytest --cov=app --cov-report=html

# Run specific test file
docker exec -it homeos-backend pytest tests/test_devices.py

# Run with verbose output
docker exec -it homeos-backend pytest -v
```

### Frontend Tests

```bash
# Run all tests
docker exec -it homeos-frontend npm test

# Run with coverage
docker exec -it homeos-frontend npm test -- --coverage

# Run in watch mode
docker exec -it homeos-frontend npm test -- --watch
```

## Development Workflow

### Making Changes

1. **Backend changes**: Edit files in `backend/` directory
   - Hot reload is enabled, changes will be reflected automatically
   - Check logs: `docker logs -f homeos-backend`

2. **Frontend changes**: Edit files in `frontend/` directory
   - Hot reload is enabled via volume mounts
   - Check logs: `docker logs -f homeos-frontend`

3. **Database changes**:
   - Modify models in `backend/app/models/`
   - Generate migration: `docker exec -it homeos-backend alembic revision --autogenerate -m "description"`
   - Apply migration: `docker exec -it homeos-backend alembic upgrade head`

### Code Quality

```bash
# Backend linting (if configured)
docker exec -it homeos-backend ruff check .

# Backend formatting
docker exec -it homeos-backend black .

# Frontend linting
docker exec -it homeos-frontend npm run lint

# Frontend formatting
docker exec -it homeos-frontend npm run format
```

## Troubleshooting

### Common Issues

#### Port Already in Use

If you see "port is already allocated" errors:

```bash
# Check what's using the port
sudo lsof -i :8000   # or :3000, :5432, :6379

# Stop the conflicting service or change ports in docker-compose.yml
```

#### Containers Won't Start

```bash
# Check container status
docker ps -a

# View container logs
docker logs homeos-backend
docker logs homeos-frontend
docker logs homeos-postgres
docker logs homeos-redis

# Rebuild containers
cd infra
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

#### Database Connection Issues

```bash
# Check if PostgreSQL is ready
docker exec -it homeos-postgres pg_isready -U homeos

# Check database logs
docker logs homeos-postgres

# Verify environment variables
docker exec -it homeos-backend env | grep DATABASE

# Reset database
./scripts/reset-db.sh
```

#### Frontend Won't Load

```bash
# Clear node_modules and reinstall
cd frontend
rm -rf node_modules package-lock.json
docker-compose down
docker-compose up -d --build frontend

# Check if backend is accessible
curl http://localhost:8000/api/v1/health
```

#### Permission Issues

```bash
# Fix file permissions
sudo chown -R $USER:$USER .

# Fix script permissions
chmod +x scripts/*.sh
```

#### Volume Issues

```bash
# Remove all volumes (WARNING: deletes all data)
cd infra
docker-compose down -v

# Restart fresh
docker-compose up -d
```

### Debugging

#### Access Container Shell

```bash
# Backend
docker exec -it homeos-backend /bin/sh

# Frontend
docker exec -it homeos-frontend /bin/sh

# PostgreSQL
docker exec -it homeos-postgres psql -U homeos -d homeos

# Redis
docker exec -it homeos-redis redis-cli
```

#### Check Service Health

```bash
# All services
docker ps

# Specific health check
docker inspect homeos-postgres | grep -A 10 Health

# Test backend
curl http://localhost:8000/docs

# Test frontend
curl http://localhost:3000
```

### Getting Help

If you encounter issues not covered here:

1. Check existing [GitHub Issues](https://github.com/yourusername/garryOS/issues)
2. Review Docker logs: `docker-compose logs`
3. Search the documentation
4. Open a new issue with:
   - Error messages
   - Docker logs
   - Steps to reproduce
   - Your environment (OS, Docker version)

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- Documentation: [docs/](docs/)
- Issues: [GitHub Issues](https://github.com/yourusername/garryOS/issues)
- Discussions: [GitHub Discussions](https://github.com/yourusername/garryOS/discussions)

## Acknowledgments

Built with:
- [FastAPI](https://fastapi.tiangolo.com/)
- [React](https://react.dev/)
- [PostgreSQL](https://www.postgresql.org/)
- [Redis](https://redis.io/)
- [Docker](https://www.docker.com/)
