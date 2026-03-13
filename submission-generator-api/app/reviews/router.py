"""
Reviews API router for human review workflow management.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, selectinload, joinedload
from sqlalchemy import func, and_, or_
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from app.core.database import get_db
from app.reviews.models import HumanReview
from app.reviews.schemas import (
    HumanReviewCreate,
    HumanReviewUpdate,
    ReviewSubmission,
    HumanReviewResponse,
    HumanReviewWithContext,
    HumanReviewSummary,
    ReviewListResponse,
    ReviewWorkflowAction,
    ReviewAssignment,
    ReviewStats
)
from app.core.schemas import PaginationParams, PaginatedResponse, MessageResponse

router = APIRouter()


@router.post("/", response_model=HumanReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(
    review: HumanReviewCreate,
    db: Session = Depends(get_db)
):
    """Create a new review."""
    # Set the appropriate foreign key based on reviewable_type
    review_data = review.model_dump()
    if review.reviewable_type == "dossier_section":
        review_data["dossier_section_id"] = review.reviewable_id
    elif review.reviewable_type == "submission":
        review_data["submission_id"] = review.reviewable_id
    elif review.reviewable_type == "extracted_content":
        review_data["extracted_content_id"] = review.reviewable_id
    
    db_review = HumanReview(**review_data)
    db.add(db_review)
    db.commit()
    db.refresh(db_review)
    
    return db_review


@router.get("/", response_model=PaginatedResponse)
async def list_reviews(
    pagination: PaginationParams = Depends(),
    reviewable_type: Optional[str] = Query(None, description="Filter by reviewable type"),
    review_status: Optional[str] = Query(None, description="Filter by review status"),
    reviewer_name: Optional[str] = Query(None, description="Filter by reviewer name"),
    db: Session = Depends(get_db)
):
    """List reviews with optional filtering and pagination."""
    query = db.query(HumanReview)
    
    # Apply filters
    if reviewable_type:
        query = query.filter(HumanReview.reviewable_type == reviewable_type)
    
    if review_status:
        query = query.filter(HumanReview.review_status == review_status)
    
    if reviewer_name:
        query = query.filter(HumanReview.reviewer_name.ilike(f"%{reviewer_name}%"))
    
    # Order by creation date (newest first)
    query = query.order_by(HumanReview.created_at.desc())
    
    # Get total count
    total = query.count()
    
    # Apply pagination and get results
    reviews = query.offset(pagination.offset).limit(pagination.limit).all()
    
    # Convert to summary format
    review_summaries = [
        HumanReviewSummary(
            id=review.id,
            reviewable_type=review.reviewable_type,
            review_status=review.review_status,
            reviewer_name=review.reviewer_name,
            reviewed_at=review.reviewed_at,
            created_at=review.created_at,
            entity_title=None  # Would be populated with joins in real implementation
        )
        for review in reviews
    ]
    
    return PaginatedResponse.create(
        items=review_summaries,
        total=total,
        pagination=pagination
    )


@router.get("/{review_id}", response_model=HumanReviewResponse)
async def get_review(
    review_id: UUID,
    db: Session = Depends(get_db)
):
    """Get a specific review by ID."""
    review = db.query(HumanReview).filter(HumanReview.id == review_id).first()
    
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
    
    return review


@router.put("/{review_id}", response_model=HumanReviewResponse)
async def update_review(
    review_id: UUID,
    review_update: HumanReviewUpdate,
    db: Session = Depends(get_db)
):
    """Update a review."""
    db_review = db.query(HumanReview).filter(HumanReview.id == review_id).first()
    
    if not db_review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
    
    # Update fields
    update_data = review_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_review, field, value)
    
    db.commit()
    db.refresh(db_review)
    
    return db_review


@router.post("/{review_id}/submit", response_model=HumanReviewResponse)
async def submit_review(
    review_id: UUID,
    review_submission: ReviewSubmission,
    db: Session = Depends(get_db)
):
    """Submit a review decision."""
    db_review = db.query(HumanReview).filter(HumanReview.id == review_id).first()
    
    if not db_review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
    
    # Update review with submission data
    db_review.review_status = review_submission.review_status
    db_review.review_comments = review_submission.review_comments
    db_review.suggested_changes = review_submission.suggested_changes
    db_review.reviewed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_review)
    
    return db_review


@router.delete("/{review_id}", response_model=MessageResponse)
async def delete_review(
    review_id: UUID,
    db: Session = Depends(get_db)
):
    """Delete a review."""
    db_review = db.query(HumanReview).filter(HumanReview.id == review_id).first()
    
    if not db_review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
    
    db.delete(db_review)
    db.commit()
    
    return MessageResponse(message="Review deleted successfully")


@router.get("/stats/overview", response_model=ReviewStats)
async def get_review_stats(
    reviewer_name: Optional[str] = Query(None, description="Filter stats by reviewer"),
    db: Session = Depends(get_db)
):
    """Get review statistics."""
    query = db.query(HumanReview)
    
    if reviewer_name:
        query = query.filter(HumanReview.reviewer_name == reviewer_name)
    
    total_reviews = query.count()
    pending_reviews = query.filter(HumanReview.review_status == "pending").count()
    approved_reviews = query.filter(HumanReview.review_status == "approved").count()
    rejected_reviews = query.filter(HumanReview.review_status == "rejected").count()
    needs_changes_reviews = query.filter(HumanReview.review_status == "needs_changes").count()
    
    # Count reviews by reviewer
    reviewer_counts = db.query(
        HumanReview.reviewer_name,
        func.count(HumanReview.id)
    ).group_by(HumanReview.reviewer_name).all()
    
    reviews_by_reviewer = {reviewer: count for reviewer, count in reviewer_counts}
    
    # Count reviews by entity type
    entity_type_counts = db.query(
        HumanReview.reviewable_type,
        func.count(HumanReview.id)
    ).group_by(HumanReview.reviewable_type).all()
    
    reviews_by_entity_type = {entity_type: count for entity_type, count in entity_type_counts}
    
    # Calculate average review time (simplified)
    average_review_time = None  # Would calculate from created_at to reviewed_at
    
    # Count overdue reviews (simplified - would use due dates)
    overdue_reviews = 0
    
    stats = ReviewStats(
        total_reviews=total_reviews,
        pending_reviews=pending_reviews,
        approved_reviews=approved_reviews,
        rejected_reviews=rejected_reviews,
        needs_changes_reviews=needs_changes_reviews,
        reviews_by_reviewer=reviews_by_reviewer,
        average_review_time=average_review_time,
        reviews_by_entity_type=reviews_by_entity_type,
        overdue_reviews=overdue_reviews
    )
    
    return stats