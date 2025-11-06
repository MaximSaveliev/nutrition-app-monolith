"""
FastAPI Application Main Entry Point
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth_router
from app.config import get_settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events
    """
    # Startup
    print("🚀 Starting FastAPI application...")
    yield
    # Shutdown
    print("👋 Shutting down FastAPI application...")


def create_application() -> FastAPI:
    """
    Application Factory Pattern
    Creates and configures the FastAPI application instance
    """
    settings = get_settings()

    app = FastAPI(
        title="Nutrition App API",
        description="AI-Powered Recipe & Nutrition Analysis API",
        version="1.0.0",
        lifespan=lifespan,
        docs_url=f"{settings.api_prefix}/docs",
        redoc_url=f"{settings.api_prefix}/redoc",
        openapi_url=f"{settings.api_prefix}/openapi.json",
    )

    # Configure CORS
    # Pattern: Middleware configuration for cross-origin requests
    # Allows: localhost (dev) and all Vercel preview/production domains
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"https://.*\.vercel\.app|http://localhost:\d+",
        allow_credentials=True,  # Required for cookie-based auth
        allow_methods=["*"],  # Allow all HTTP methods
        allow_headers=["*"],  # Allow all headers including Authorization
    )

    # Include routers
    app.include_router(auth_router, prefix=settings.api_prefix)

    @app.get("/")
    async def root():
        """Root endpoint"""
        return {
            "message": "Nutrition App API",
            "version": "1.0.0",
            "docs": f"{settings.api_prefix}/docs",
        }

    @app.get("/health")
    async def health_check():
        """Health check endpoint"""
        return {"status": "healthy", "environment": settings.app_env}

    return app


# Create the application instance
app = create_application()
