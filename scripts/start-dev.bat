@echo off
REM HomeOS Development Environment Startup Script (Windows)
REM This script starts all HomeOS services using Docker Compose

echo ========================================
echo    HomeOS Development Environment
echo ========================================
echo.

REM Get the script directory and project root
set SCRIPT_DIR=%~dp0
set PROJECT_ROOT=%SCRIPT_DIR%..

REM Check if .env file exists
if not exist "%PROJECT_ROOT%\.env" (
    echo Warning: .env file not found
    echo Creating .env from .env.example...
    if exist "%PROJECT_ROOT%\.env.example" (
        copy "%PROJECT_ROOT%\.env.example" "%PROJECT_ROOT%\.env" > nul
        echo [OK] Created .env file
    ) else (
        echo [ERROR] .env.example not found
        exit /b 1
    )
)

REM Navigate to infra directory
cd /d "%PROJECT_ROOT%\infra"

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running
    echo Please start Docker Desktop and try again
    pause
    exit /b 1
)

echo Starting HomeOS services...
echo.

REM Pull latest images
echo Pulling latest Docker images...
docker-compose pull

REM Build and start services
echo Building and starting containers...
docker-compose up -d --build

REM Wait for services to be healthy
echo.
echo Waiting for services to be ready...
timeout /t 5 /nobreak > nul

REM Check service status
echo.
echo Service Status:
docker-compose ps

echo.
echo ========================================
echo    HomeOS is now running!
echo ========================================
echo.
echo Access the services at:
echo   Frontend:     http://localhost:3000
echo   Backend API:  http://localhost:8000
echo   API Docs:     http://localhost:8000/docs
echo   PostgreSQL:   localhost:5432
echo   Redis:        localhost:6379
echo.
echo To view logs:
echo   docker-compose -f "%PROJECT_ROOT%\infra\docker-compose.yml" logs -f
echo.
echo To stop services:
echo   docker-compose -f "%PROJECT_ROOT%\infra\docker-compose.yml" down
echo.
pause
