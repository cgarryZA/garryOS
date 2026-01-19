"""
HomeOS API - Main application entry point.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events.
    """
    # Startup
    print("🚀 Starting HomeOS API...")

    # Initialize database
    from app.core.database import init_db
    print("📦 Initializing database...")
    init_db()

    # Start scheduler
    from app.core.scheduler import scheduler
    print("🕐 Starting scheduler...")
    scheduler.start()

    print("✅ HomeOS API ready!")

    yield

    # Shutdown
    print("👋 Shutting down HomeOS API...")

    # Stop scheduler
    from app.core.scheduler import scheduler
    scheduler.shutdown()

    print("✅ HomeOS API shut down gracefully")


# Create FastAPI application
app = FastAPI(
    title=settings.API_TITLE,
    version=settings.API_VERSION,
    description="HomeOS - Your local-first personal operating system",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
from app.modules.calendar.router import router as calendar_router
app.include_router(calendar_router)


@app.get("/")
async def root():
    """
    Root endpoint - API information.
    """
    return {
        "name": settings.API_TITLE,
        "version": settings.API_VERSION,
        "status": "running",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health")
async def health_check():
    """
    Health check endpoint.
    """
    return {
        "status": "healthy",
        "service": "HomeOS API",
        "version": settings.API_VERSION,
    }
