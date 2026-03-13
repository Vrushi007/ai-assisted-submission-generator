"""
Products API router with full CRUD operations.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, selectinload, joinedload
from sqlalchemy import func, and_, or_
from typing import List, Optional
from uuid import UUID

from app.core.database import get_db
from app.products.models import Product
from app.projects.models import Project
from app.products.schemas import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    ProductSummary,
    ProductWithProject,
    ProductListResponse,
    ProductStats,
    ProductSearchFilters
)
from app.core.schemas import PaginationParams, PaginatedResponse, MessageResponse

router = APIRouter()


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db)
):
    """Create a new product."""
    # Verify project exists
    project = db.query(Project).filter(Project.id == product.project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    db_product = Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    
    # Add computed fields
    db_product.submissions_count = 0
    db_product.latest_submission_status = None
    db_product.latest_submission_date = None
    
    return db_product


@router.get("/", response_model=PaginatedResponse)
async def list_products(
    pagination: PaginationParams = Depends(),
    project_id: Optional[UUID] = Query(None, description="Filter by project ID"),
    regulation_type: Optional[str] = Query(None, description="Filter by regulation type"),
    risk_classification: Optional[str] = Query(None, description="Filter by risk classification"),
    device_type: Optional[str] = Query(None, description="Filter by device type"),
    search: Optional[str] = Query(None, description="Search in product name or intended use"),
    db: Session = Depends(get_db)
):
    """List products with optional filtering and pagination."""
    query = db.query(Product).options(joinedload(Product.project))
    
    # Apply filters
    if project_id:
        query = query.filter(Product.project_id == project_id)
    
    if regulation_type:
        query = query.filter(Product.regulation_type == regulation_type)
    
    if risk_classification:
        query = query.filter(Product.risk_classification == risk_classification)
    
    if device_type:
        query = query.filter(Product.device_type.ilike(f"%{device_type}%"))
    
    if search:
        query = query.filter(
            or_(
                Product.name.ilike(f"%{search}%"),
                Product.intended_use.ilike(f"%{search}%"),
                Product.device_type.ilike(f"%{search}%")
            )
        )
    
    # Get total count
    total = query.count()
    
    # Apply pagination and get results
    products = query.offset(pagination.offset).limit(pagination.limit).all()
    
    # Convert to summary format
    product_summaries = []
    for product in products:
        submissions_count = len(product.submissions) if hasattr(product, 'submissions') else 0
        
        product_summary = ProductSummary(
            id=product.id,
            name=product.name,
            device_type=product.device_type,
            regulation_type=product.regulation_type,
            risk_classification=product.risk_classification,
            created_at=product.created_at,
            submissions_count=submissions_count
        )
        product_summaries.append(product_summary)
    
    return PaginatedResponse.create(
        items=product_summaries,
        total=total,
        pagination=pagination
    )


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: UUID,
    db: Session = Depends(get_db)
):
    """Get a specific product by ID."""
    product = db.query(Product).options(
        selectinload(Product.submissions),
        joinedload(Product.project)
    ).filter(Product.id == product_id).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Add computed fields
    product.submissions_count = len(product.submissions)
    
    # Get latest submission info
    if product.submissions:
        latest_submission = max(product.submissions, key=lambda s: s.created_at)
        product.latest_submission_status = latest_submission.status
        product.latest_submission_date = latest_submission.created_at
    else:
        product.latest_submission_status = None
        product.latest_submission_date = None
    
    return product


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: UUID,
    product_update: ProductUpdate,
    db: Session = Depends(get_db)
):
    """Update a specific product."""
    db_product = db.query(Product).filter(Product.id == product_id).first()
    
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Update fields
    update_data = product_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_product, field, value)
    
    db.commit()
    db.refresh(db_product)
    
    # Add computed fields
    db_product.submissions_count = len(db_product.submissions) if hasattr(db_product, 'submissions') else 0
    db_product.latest_submission_status = None
    db_product.latest_submission_date = None
    
    return db_product


@router.delete("/{product_id}", response_model=MessageResponse)
async def delete_product(
    product_id: UUID,
    db: Session = Depends(get_db)
):
    """Delete a specific product."""
    db_product = db.query(Product).filter(Product.id == product_id).first()
    
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    db.delete(db_product)
    db.commit()
    
    return MessageResponse(message="Product deleted successfully")


@router.get("/{product_id}/with-project", response_model=ProductWithProject)
async def get_product_with_project(
    product_id: UUID,
    db: Session = Depends(get_db)
):
    """Get a product with its project information."""
    product = db.query(Product).options(
        joinedload(Product.project),
        selectinload(Product.submissions)
    ).filter(Product.id == product_id).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Create response with project info
    response_data = ProductResponse.model_validate(product).model_dump()
    response_data.update({
        "project_name": product.project.name,
        "client_name": product.project.client_name,
        "submissions_count": len(product.submissions)
    })
    
    return ProductWithProject(**response_data)


@router.post("/search", response_model=PaginatedResponse)
async def search_products(
    filters: ProductSearchFilters,
    pagination: PaginationParams = Depends(),
    db: Session = Depends(get_db)
):
    """Advanced product search with filters."""
    query = db.query(Product).options(joinedload(Product.project))
    
    # Apply filters from the search filters schema
    if filters.project_id:
        query = query.filter(Product.project_id == filters.project_id)
    
    if filters.regulation_type:
        query = query.filter(Product.regulation_type == filters.regulation_type)
    
    if filters.risk_classification:
        query = query.filter(Product.risk_classification == filters.risk_classification)
    
    if filters.device_type:
        query = query.filter(Product.device_type.ilike(f"%{filters.device_type}%"))
    
    if filters.manufacturer:
        query = query.filter(Product.manufacturer.ilike(f"%{filters.manufacturer}%"))
    
    if filters.search_term:
        query = query.filter(
            or_(
                Product.name.ilike(f"%{filters.search_term}%"),
                Product.device_type.ilike(f"%{filters.search_term}%"),
                Product.intended_use.ilike(f"%{filters.search_term}%")
            )
        )
    
    # Get total count
    total = query.count()
    
    # Apply pagination and get results
    products = query.offset(pagination.offset).limit(pagination.limit).all()
    
    # Convert to summary format
    product_summaries = [
        ProductSummary(
            id=product.id,
            name=product.name,
            device_type=product.device_type,
            regulation_type=product.regulation_type,
            risk_classification=product.risk_classification,
            created_at=product.created_at,
            submissions_count=len(product.submissions) if hasattr(product, 'submissions') else 0
        )
        for product in products
    ]
    
    return PaginatedResponse.create(
        items=product_summaries,
        total=total,
        pagination=pagination
    )


@router.get("/stats/overview", response_model=ProductStats)
async def get_product_stats(
    project_id: Optional[UUID] = Query(None, description="Filter stats by project"),
    db: Session = Depends(get_db)
):
    """Get product statistics."""
    query = db.query(Product)
    
    if project_id:
        query = query.filter(Product.project_id == project_id)
    
    total_products = query.count()
    
    # Count by regulation type
    ivd_products = query.filter(Product.regulation_type == "IVD").count()
    non_ivd_products = query.filter(Product.regulation_type == "non_IVD").count()
    
    # Count by risk classification
    risk_class_counts = db.query(
        Product.risk_classification,
        func.count(Product.id)
    ).group_by(Product.risk_classification).all()
    
    products_by_risk_class = {
        risk_class or "Unclassified": count 
        for risk_class, count in risk_class_counts
    }
    
    # Count by device type (top 10)
    device_type_counts = db.query(
        Product.device_type,
        func.count(Product.id)
    ).group_by(Product.device_type).order_by(
        func.count(Product.id).desc()
    ).limit(10).all()
    
    products_by_device_type = [
        {"device_type": device_type, "count": count}
        for device_type, count in device_type_counts
    ]
    
    stats = ProductStats(
        total_products=total_products,
        ivd_products=ivd_products,
        non_ivd_products=non_ivd_products,
        products_by_risk_class=products_by_risk_class,
        products_by_device_type=products_by_device_type
    )
    
    return stats