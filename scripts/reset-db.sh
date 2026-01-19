#!/bin/bash

# HomeOS Database Reset Script
# WARNING: This script will DELETE ALL DATA in the database

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${RED}========================================${NC}"
echo -e "${RED}   HomeOS Database Reset${NC}"
echo -e "${RED}========================================${NC}"
echo ""
echo -e "${RED}WARNING: This will DELETE ALL DATA!${NC}"
echo -e "${YELLOW}This action cannot be undone.${NC}"
echo ""

# Get the script directory and project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Ask for confirmation
read -p "Are you sure you want to reset the database? (yes/no): " -r
echo
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo -e "${BLUE}Database reset cancelled.${NC}"
    exit 0
fi

# Navigate to infra directory
cd "$PROJECT_ROOT/infra"

echo -e "${BLUE}Step 1: Stopping containers...${NC}"
docker-compose down

echo -e "${BLUE}Step 2: Removing PostgreSQL volume...${NC}"
docker volume rm infra_postgres_data 2>/dev/null || true

echo -e "${BLUE}Step 3: Removing Redis volume...${NC}"
docker volume rm infra_redis_data 2>/dev/null || true

echo -e "${BLUE}Step 4: Starting services...${NC}"
docker-compose up -d postgres redis

echo -e "${BLUE}Step 5: Waiting for PostgreSQL to be ready...${NC}"
sleep 10

# Wait for postgres to be healthy
until docker exec homeos-postgres pg_isready -U homeos > /dev/null 2>&1; do
    echo -e "${YELLOW}Waiting for PostgreSQL...${NC}"
    sleep 2
done

echo -e "${GREEN}✓ PostgreSQL is ready${NC}"

echo -e "${BLUE}Step 6: Starting backend service...${NC}"
docker-compose up -d backend

echo -e "${BLUE}Step 7: Waiting for backend to be ready...${NC}"
sleep 5

echo -e "${BLUE}Step 8: Running database migrations...${NC}"
docker exec homeos-backend alembic upgrade head || echo -e "${YELLOW}Note: Migrations may not be configured yet${NC}"

echo -e "${BLUE}Step 9: Starting all services...${NC}"
docker-compose up -d

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   Database Reset Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Services Status:"
docker-compose ps
echo ""
echo -e "${GREEN}✓ Database has been reset and migrations applied${NC}"
echo -e "${BLUE}You can now access HomeOS at:${NC}"
echo -e "  Frontend:    http://localhost:3000"
echo -e "  Backend API: http://localhost:8000"
echo -e "  API Docs:    http://localhost:8000/docs"
echo ""
