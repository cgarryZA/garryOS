#!/bin/bash

# HomeOS Development Environment Startup Script
# This script starts all HomeOS services using Docker Compose

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   HomeOS Development Environment${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Get the script directory and project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Check if .env file exists
if [ ! -f "$PROJECT_ROOT/.env" ]; then
    echo -e "${YELLOW}Warning: .env file not found${NC}"
    echo -e "Creating .env from .env.example..."
    if [ -f "$PROJECT_ROOT/.env.example" ]; then
        cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
        echo -e "${GREEN}✓ Created .env file${NC}"
    else
        echo -e "${RED}Error: .env.example not found${NC}"
        exit 1
    fi
fi

# Navigate to infra directory
cd "$PROJECT_ROOT/infra"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not running${NC}"
    echo "Please start Docker and try again"
    exit 1
fi

echo -e "${BLUE}Starting HomeOS services...${NC}"
echo ""

# Pull latest images
echo -e "${BLUE}Pulling latest Docker images...${NC}"
docker-compose pull

# Build and start services
echo -e "${BLUE}Building and starting containers...${NC}"
docker-compose up -d --build

# Wait for services to be healthy
echo ""
echo -e "${BLUE}Waiting for services to be ready...${NC}"
sleep 5

# Check service status
echo ""
echo -e "${BLUE}Service Status:${NC}"
docker-compose ps

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   HomeOS is now running!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Access the services at:"
echo -e "  ${BLUE}Frontend:${NC}     http://localhost:3000"
echo -e "  ${BLUE}Backend API:${NC}  http://localhost:8000"
echo -e "  ${BLUE}API Docs:${NC}     http://localhost:8000/docs"
echo -e "  ${BLUE}PostgreSQL:${NC}   localhost:5432"
echo -e "  ${BLUE}Redis:${NC}        localhost:6379"
echo ""
echo -e "To view logs:"
echo -e "  ${YELLOW}docker-compose -f $PROJECT_ROOT/infra/docker-compose.yml logs -f${NC}"
echo ""
echo -e "To stop services:"
echo -e "  ${YELLOW}docker-compose -f $PROJECT_ROOT/infra/docker-compose.yml down${NC}"
echo ""
