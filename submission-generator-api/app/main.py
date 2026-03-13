"""
Main FastAPI application entry point.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.core.config import settings
from app.core.database import engine, Base
import app.models  # Import all models to register them
from app.projects.router import router as projects_router
from app.products.router import router as products_router
from app.submissions.router import router as submissions_router
from app.dossier.router import router as dossier_router
from app.files.router import router as files_router
from app.ai.router import router as ai_router
from app.reviews.router import router as reviews_router
from app.validation.router import router as validation_router
from app.dashboard.router import router as dashboard_router


def create_application() -> FastAPI:
    """Create and configure the FastAPI application."""
    
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="AI-Assisted Regulatory Submission Builder API",
        docs_url="/api/docs" if settings.DEBUG else None,
        redoc_url="/api/redoc" if settings.DEBUG else None,
    )

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3030"
        ],  # React dev server (multiple ports)
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include routers
    app.include_router(projects_router, prefix="/api/projects", tags=["projects"])
    app.include_router(products_router, prefix="/api/products", tags=["products"])
    app.include_router(submissions_router, prefix="/api/submissions", tags=["submissions"])
    app.include_router(dossier_router, prefix="/api/dossier", tags=["dossier"])
    app.include_router(files_router, prefix="/api/files", tags=["files"])
    app.include_router(ai_router, prefix="/api/ai", tags=["ai"])
    app.include_router(reviews_router, prefix="/api/reviews", tags=["reviews"])
    app.include_router(validation_router, prefix="/api/validation", tags=["validation"])
    app.include_router(dashboard_router, prefix="/api/dashboard", tags=["dashboard"])

    # Static file serving for uploads
    if os.path.exists(settings.UPLOAD_DIR):
        app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

    return app


# Create the application instance
app = create_application()


@app.on_event("startup")
async def startup_event():
    """Initialize application on startup."""
    # Create upload directory if it doesn't exist
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(settings.TEMPLATES_DIR, exist_ok=True)


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "version": settings.APP_VERSION}