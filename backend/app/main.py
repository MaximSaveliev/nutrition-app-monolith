"""
FastAPI Application Entry Point
Pattern: Factory (Creational) - Application factory creates configured FastAPI instance
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth_router
from app.api.recipes import router as recipes_router
from app.api.nutrition import router as nutrition_router
from app.api.admin import router as admin_router
from app.config import get_settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle management"""
    print("🚀 Starting FastAPI application...")
    yield
    print("👋 Shutting down FastAPI application...")


def create_application() -> FastAPI:
    """
    Pattern: Factory (Creational)
    Creates and configures FastAPI application with all dependencies
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

    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"https://.*\.vercel\.app|http://localhost:\d+",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth_router, prefix=settings.api_prefix)
    app.include_router(recipes_router, prefix=settings.api_prefix)
    app.include_router(nutrition_router, prefix=settings.api_prefix)
    app.include_router(admin_router, prefix=settings.api_prefix)

    @app.get("/")
    async def root():
        return {"message": "Nutrition App API", "version": "1.0.0", "docs": f"{settings.api_prefix}/docs"}

    @app.get("/health")
    async def health_check():
        return {"status": "healthy", "environment": settings.app_env}

    return app


app = create_application()
