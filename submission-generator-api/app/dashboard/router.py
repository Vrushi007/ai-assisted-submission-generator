"""
Dashboard API endpoints for statistics and recent activity.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta

from app.core.database import get_db
from app.projects.models import Project
from app.submissions.models import Submission
from app.files.models import UploadedFile

router = APIRouter()


@router.get("/stats")
async def get_dashboard_stats(db: Session = Depends(get_db)):
    """Get dashboard statistics."""
    
    # Count projects by status
    total_projects = db.query(Project).count()
    active_projects = db.query(Project).filter(Project.status == "active").count()
    
    # Count submissions
    total_submissions = db.query(Submission).count()
    pending_reviews = db.query(Submission).filter(
        Submission.status.in_(["draft", "human_review"])
    ).count()
    
    # Count files processed today
    today = datetime.utcnow().date()
    files_processed = db.query(UploadedFile).filter(
        func.date(UploadedFile.created_at) == today
    ).count()
    
    # Count AI extractions today (placeholder - would need ExtractedContent model)
    ai_extractions_today = 0  # Placeholder until ExtractedContent model is available
    
    return {
        "total_projects": total_projects,
        "active_projects": active_projects,
        "total_submissions": total_submissions,
        "pending_reviews": pending_reviews,
        "files_processed": files_processed,
        "ai_extractions_today": ai_extractions_today,
    }


@router.get("/activity")
async def get_recent_activity(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """Get recent activity across the system."""
    
    activities = []
    
    # Recent projects (last 7 days)
    recent_projects = db.query(Project).filter(
        Project.created_at >= datetime.utcnow() - timedelta(days=7)
    ).order_by(desc(Project.created_at)).limit(limit // 2).all()
    
    for project in recent_projects:
        activities.append({
            "id": f"project_{project.id}",
            "type": "project_created",
            "title": "New Project Created",
            "description": f"{project.name} - {project.status.title()} Project",
            "timestamp": project.created_at.isoformat(),
            "user": "System User",  # In real app, would be from user table
        })
    
    # Recent file uploads (last 7 days)
    recent_files = db.query(UploadedFile).filter(
        UploadedFile.created_at >= datetime.utcnow() - timedelta(days=7)
    ).order_by(desc(UploadedFile.created_at)).limit(limit // 2).all()
    
    for file in recent_files:
        activities.append({
            "id": f"file_{file.id}",
            "type": "file_uploaded",
            "title": "File Uploaded",
            "description": f"{file.original_filename} ({file.file_size} bytes)",
            "timestamp": file.created_at.isoformat(),
            "user": file.uploaded_by or "Unknown User",
        })
    
    # Sort by timestamp and limit
    activities.sort(key=lambda x: x["timestamp"], reverse=True)
    return activities[:limit]