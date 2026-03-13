"""
Project models for managing regulatory projects and clients.
"""

from sqlalchemy import Column, String, Text, Enum
from sqlalchemy.orm import relationship
import enum

from app.core.models import BaseModel, AuditMixin


class ProjectStatus(str, enum.Enum):
    """Project status enumeration."""
    ACTIVE = "active"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Project(BaseModel, AuditMixin):
    """
    Regulatory project model.
    
    Represents a top-level regulatory project for a client,
    which can contain multiple products and submissions.
    """
    
    __tablename__ = "projects"
    
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    client_name = Column(String(255), nullable=False, index=True)
    client_contact_email = Column(String(255), nullable=True)
    status = Column(Enum(ProjectStatus), default=ProjectStatus.ACTIVE, nullable=False, index=True)
    
    # Relationships
    products = relationship("Product", back_populates="project", cascade="all, delete-orphan")
    submissions = relationship("Submission", back_populates="project", cascade="all, delete-orphan")
    files = relationship("UploadedFile", back_populates="project", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<Project(id={self.id}, name='{self.name}', client='{self.client_name}')>"