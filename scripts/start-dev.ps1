# HomeOS Development Environment Startup Script (PowerShell)
# This script starts all HomeOS services using Docker Compose

# Set error action preference
$ErrorActionPreference = "Stop"

# Colors
$Blue = "Cyan"
$Green = "Green"
$Yellow = "Yellow"
$Red = "Red"

Write-Host "========================================" -ForegroundColor $Blue
Write-Host "   HomeOS Development Environment" -ForegroundColor $Blue
Write-Host "========================================" -ForegroundColor $Blue
Write-Host ""

# Get the script directory and project root
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

# Check if .env file exists
$EnvFile = Join-Path $ProjectRoot ".env"
$EnvExample = Join-Path $ProjectRoot ".env.example"

if (-not (Test-Path $EnvFile)) {
    Write-Host "Warning: .env file not found" -ForegroundColor $Yellow
    Write-Host "Creating .env from .env.example..."

    if (Test-Path $EnvExample) {
        Copy-Item $EnvExample $EnvFile
        Write-Host "[OK] Created .env file" -ForegroundColor $Green
    } else {
        Write-Host "[ERROR] .env.example not found" -ForegroundColor $Red
        exit 1
    }
}

# Navigate to infra directory
$InfraDir = Join-Path $ProjectRoot "infra"
Set-Location $InfraDir

# Check if Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Host "[ERROR] Docker is not running" -ForegroundColor $Red
    Write-Host "Please start Docker Desktop and try again"
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Starting HomeOS services..." -ForegroundColor $Blue
Write-Host ""

# Pull latest images
Write-Host "Pulling latest Docker images..." -ForegroundColor $Blue
docker-compose pull

# Build and start services
Write-Host "Building and starting containers..." -ForegroundColor $Blue
docker-compose up -d --build

# Wait for services to be healthy
Write-Host ""
Write-Host "Waiting for services to be ready..." -ForegroundColor $Blue
Start-Sleep -Seconds 5

# Check service status
Write-Host ""
Write-Host "Service Status:" -ForegroundColor $Blue
docker-compose ps

Write-Host ""
Write-Host "========================================" -ForegroundColor $Green
Write-Host "   HomeOS is now running!" -ForegroundColor $Green
Write-Host "========================================" -ForegroundColor $Green
Write-Host ""
Write-Host "Access the services at:"
Write-Host "  Frontend:     " -NoNewline; Write-Host "http://localhost:3000" -ForegroundColor $Blue
Write-Host "  Backend API:  " -NoNewline; Write-Host "http://localhost:8000" -ForegroundColor $Blue
Write-Host "  API Docs:     " -NoNewline; Write-Host "http://localhost:8000/docs" -ForegroundColor $Blue
Write-Host "  PostgreSQL:   " -NoNewline; Write-Host "localhost:5432" -ForegroundColor $Blue
Write-Host "  Redis:        " -NoNewline; Write-Host "localhost:6379" -ForegroundColor $Blue
Write-Host ""
Write-Host "To view logs:" -ForegroundColor $Yellow
Write-Host "  docker-compose -f `"$InfraDir\docker-compose.yml`" logs -f"
Write-Host ""
Write-Host "To stop services:" -ForegroundColor $Yellow
Write-Host "  docker-compose -f `"$InfraDir\docker-compose.yml`" down"
Write-Host ""
Read-Host "Press Enter to exit"
