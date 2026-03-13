"""
File upload and storage services.
"""

import os
import uuid
import shutil
import mimetypes
from pathlib import Path
from typing import List, Dict, Any, Optional, BinaryIO
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException, status
import hashlib
try:
    import magic
    HAS_MAGIC = True
except ImportError:
    HAS_MAGIC = False

from app.core.config import settings
from app.files.models import UploadedFile, FileType
from app.projects.models import Project
from app.submissions.models import Submission


class FileStorageService:
    """Service for handling file storage operations."""
    
    def __init__(self):
        self.upload_dir = Path(settings.UPLOAD_DIR)
        self.max_file_size = settings.MAX_FILE_SIZE_MB * 1024 * 1024  # Convert MB to bytes
        self._ensure_upload_directory()
    
    def _ensure_upload_directory(self):
        """Ensure upload directory structure exists."""
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Create subdirectories for organization
        subdirs = ["projects", "submissions", "temp", "processed"]
        for subdir in subdirs:
            (self.upload_dir / subdir).mkdir(exist_ok=True)
    
    def _get_file_type(self, filename: str, content_type: str) -> FileType:
        """Determine file type based on filename and content type."""
        filename_lower = filename.lower()
        
        # PDF files
        if filename_lower.endswith('.pdf'):
            return FileType.PDF
        
        # DOCX files
        elif filename_lower.endswith(('.docx', '.doc')):
            return FileType.DOCX
        
        # XLSX files
        elif filename_lower.endswith(('.xlsx', '.xls', '.csv')):
            return FileType.XLSX
        
        # Default to other
        else:
            return FileType.OTHER
    
    def _calculate_file_hash(self, file_path: Path) -> str:
        """Calculate SHA-256 hash of file for integrity checking."""
        hash_sha256 = hashlib.sha256()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_sha256.update(chunk)
        return hash_sha256.hexdigest()
    
    def _get_storage_path(self, project_id: uuid.UUID, submission_id: Optional[uuid.UUID] = None) -> Path:
        """Get the storage path for a file based on project and submission."""
        if submission_id:
            return self.upload_dir / "submissions" / str(submission_id)
        else:
            return self.upload_dir / "projects" / str(project_id)
    
    def _sanitize_filename(self, filename: str) -> str:
        """Sanitize filename to prevent path traversal and other issues."""
        # Remove path components
        filename = os.path.basename(filename)
        
        # Replace problematic characters
        problematic_chars = '<>:"/\\|?*'
        for char in problematic_chars:
            filename = filename.replace(char, '_')
        
        # Limit length
        if len(filename) > 255:
            name, ext = os.path.splitext(filename)
            filename = name[:255-len(ext)] + ext
        
        return filename
    
    async def save_uploaded_file(
        self,
        file: UploadFile,
        project_id: uuid.UUID,
        submission_id: Optional[uuid.UUID] = None,
        description: Optional[str] = None
    ) -> Dict[str, Any]:
        """Save an uploaded file and return file metadata."""
        
        # Validate file size
        if file.size and file.size > self.max_file_size:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File size ({file.size} bytes) exceeds maximum allowed size ({self.max_file_size} bytes)"
            )
        
        # Sanitize filename
        safe_filename = self._sanitize_filename(file.filename or "unknown")
        
        # Generate unique filename to prevent conflicts
        file_id = uuid.uuid4()
        name, ext = os.path.splitext(safe_filename)
        unique_filename = f"{file_id}{ext}"
        
        # Determine storage path
        storage_path = self._get_storage_path(project_id, submission_id)
        storage_path.mkdir(parents=True, exist_ok=True)
        
        file_path = storage_path / unique_filename
        
        try:
            # Save file to disk
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            # Get actual file size
            file_size = file_path.stat().st_size
            
            # Calculate file hash
            file_hash = self._calculate_file_hash(file_path)
            
            # Determine file type
            file_type = self._get_file_type(safe_filename, file.content_type or "")
            
            # Detect MIME type using python-magic if available
            if HAS_MAGIC:
                try:
                    detected_mime_type = magic.from_file(str(file_path), mime=True)
                except:
                    detected_mime_type = file.content_type or mimetypes.guess_type(safe_filename)[0] or "application/octet-stream"
            else:
                detected_mime_type = file.content_type or mimetypes.guess_type(safe_filename)[0] or "application/octet-stream"
            
            return {
                "file_id": file_id,
                "original_filename": safe_filename,
                "stored_filename": unique_filename,
                "file_path": str(file_path),
                "file_size": file_size,
                "file_hash": file_hash,
                "file_type": file_type,
                "mime_type": detected_mime_type,
                "description": description
            }
            
        except Exception as e:
            # Clean up file if saving metadata fails
            if file_path.exists():
                file_path.unlink()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error saving file: {str(e)}"
            )
    
    def get_file_path(self, file_record: UploadedFile) -> Path:
        """Get the full path to a stored file."""
        storage_path = self._get_storage_path(file_record.project_id, file_record.submission_id)
        return storage_path / file_record.stored_filename
    
    def delete_file(self, file_record: UploadedFile) -> bool:
        """Delete a file from storage."""
        file_path = self.get_file_path(file_record)
        try:
            if file_path.exists():
                file_path.unlink()
                return True
            return False
        except Exception:
            return False
    
    def verify_file_integrity(self, file_record: UploadedFile) -> bool:
        """Verify file integrity using stored hash."""
        file_path = self.get_file_path(file_record)
        if not file_path.exists():
            return False
        
        current_hash = self._calculate_file_hash(file_path)
        return current_hash == file_record.file_hash
    
    def get_storage_stats(self) -> Dict[str, Any]:
        """Get storage statistics."""
        stats = {
            "total_files": 0,
            "total_size": 0,
            "by_type": {},
            "by_project": {},
            "storage_path": str(self.upload_dir)
        }
        
        if not self.upload_dir.exists():
            return stats
        
        for file_path in self.upload_dir.rglob("*"):
            if file_path.is_file():
                stats["total_files"] += 1
                file_size = file_path.stat().st_size
                stats["total_size"] += file_size
                
                # Count by extension
                ext = file_path.suffix.lower()
                if ext not in stats["by_type"]:
                    stats["by_type"][ext] = {"count": 0, "size": 0}
                stats["by_type"][ext]["count"] += 1
                stats["by_type"][ext]["size"] += file_size
        
        return stats


class FileValidationService:
    """Service for validating uploaded files."""
    
    ALLOWED_EXTENSIONS = {
        'documents': {'.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt'},
        'images': {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.svg', '.webp'},
        'spreadsheets': {'.xls', '.xlsx', '.csv', '.ods'},
        'presentations': {'.ppt', '.pptx', '.odp'},
        'archives': {'.zip', '.rar', '.7z', '.tar', '.gz'},
        'media': {'.mp4', '.avi', '.mov', '.wmv', '.mp3', '.wav'}
    }
    
    DANGEROUS_EXTENSIONS = {'.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js'}
    
    @classmethod
    def validate_file_extension(cls, filename: str) -> Dict[str, Any]:
        """Validate file extension."""
        ext = Path(filename).suffix.lower()
        
        # Check for dangerous extensions
        if ext in cls.DANGEROUS_EXTENSIONS:
            return {
                "is_valid": False,
                "error": f"File type '{ext}' is not allowed for security reasons",
                "category": "security"
            }
        
        # Check if extension is in allowed list
        allowed = False
        category = "other"
        
        for cat, extensions in cls.ALLOWED_EXTENSIONS.items():
            if ext in extensions:
                allowed = True
                category = cat
                break
        
        if not allowed and ext:  # Allow files without extensions
            return {
                "is_valid": False,
                "error": f"File type '{ext}' is not supported",
                "category": "unsupported"
            }
        
        return {
            "is_valid": True,
            "category": category,
            "extension": ext
        }
    
    @classmethod
    def validate_file_content(cls, file_path: Path) -> Dict[str, Any]:
        """Validate file content (basic checks)."""
        try:
            # Check if file is readable
            with open(file_path, 'rb') as f:
                # Read first few bytes to check for common malicious patterns
                header = f.read(1024)
                
                # Basic checks for executable signatures
                if header.startswith(b'MZ'):  # Windows executable
                    return {
                        "is_valid": False,
                        "error": "File appears to be an executable",
                        "category": "security"
                    }
                
                # Check for script signatures
                if header.startswith(b'#!/') or b'<script' in header.lower():
                    return {
                        "is_valid": False,
                        "error": "File appears to contain executable script content",
                        "category": "security"
                    }
            
            return {"is_valid": True}
            
        except Exception as e:
            return {
                "is_valid": False,
                "error": f"Error reading file: {str(e)}",
                "category": "error"
            }
    
    @classmethod
    def validate_upload(cls, file: UploadFile, max_size_mb: int = 100) -> Dict[str, Any]:
        """Comprehensive validation of uploaded file."""
        errors = []
        warnings = []
        
        # Validate filename
        if not file.filename:
            errors.append("Filename is required")
        else:
            ext_validation = cls.validate_file_extension(file.filename)
            if not ext_validation["is_valid"]:
                errors.append(ext_validation["error"])
        
        # Validate file size
        if file.size:
            max_size_bytes = max_size_mb * 1024 * 1024
            if file.size > max_size_bytes:
                errors.append(f"File size ({file.size} bytes) exceeds maximum ({max_size_bytes} bytes)")
            elif file.size == 0:
                errors.append("File is empty")
        
        # Validate content type
        if file.content_type:
            suspicious_types = ['application/x-msdownload', 'application/x-executable']
            if file.content_type in suspicious_types:
                errors.append(f"Content type '{file.content_type}' is not allowed")
        
        return {
            "is_valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings
        }


class FileBatchService:
    """Service for handling batch file operations."""
    
    def __init__(self, db: Session):
        self.db = db
        self.storage_service = FileStorageService()
    
    async def upload_multiple_files(
        self,
        files: List[UploadFile],
        project_id: uuid.UUID,
        submission_id: Optional[uuid.UUID] = None
    ) -> Dict[str, Any]:
        """Upload multiple files in batch."""
        
        results = {
            "successful": [],
            "failed": [],
            "total_files": len(files),
            "total_size": 0
        }
        
        for file in files:
            try:
                # Validate file
                validation = FileValidationService.validate_upload(file, settings.MAX_FILE_SIZE_MB)
                if not validation["is_valid"]:
                    results["failed"].append({
                        "filename": file.filename,
                        "errors": validation["errors"]
                    })
                    continue
                
                # Save file
                file_metadata = await self.storage_service.save_uploaded_file(
                    file, project_id, submission_id
                )
                
                # Create database record
                db_file = UploadedFile(
                    id=file_metadata["file_id"],
                    project_id=project_id,
                    submission_id=submission_id,
                    original_filename=file_metadata["original_filename"],
                    stored_filename=file_metadata["stored_filename"],
                    file_path=file_metadata["file_path"],
                    file_size=file_metadata["file_size"],
                    file_type=file_metadata["file_type"],
                    mime_type=file_metadata["mime_type"],
                    file_hash=file_metadata["file_hash"]
                )
                
                self.db.add(db_file)
                results["successful"].append({
                    "filename": file.filename,
                    "file_id": str(file_metadata["file_id"]),
                    "size": file_metadata["file_size"]
                })
                results["total_size"] += file_metadata["file_size"]
                
            except Exception as e:
                results["failed"].append({
                    "filename": file.filename,
                    "error": str(e)
                })
        
        # Commit all successful uploads
        if results["successful"]:
            self.db.commit()
        
        return results
    
    def delete_multiple_files(self, file_ids: List[uuid.UUID]) -> Dict[str, Any]:
        """Delete multiple files in batch."""
        
        results = {
            "successful": [],
            "failed": [],
            "total_files": len(file_ids)
        }
        
        for file_id in file_ids:
            try:
                # Get file record
                file_record = self.db.query(UploadedFile).filter(UploadedFile.id == file_id).first()
                if not file_record:
                    results["failed"].append({
                        "file_id": str(file_id),
                        "error": "File not found in database"
                    })
                    continue
                
                # Delete from storage
                if self.storage_service.delete_file(file_record):
                    # Delete from database
                    self.db.delete(file_record)
                    results["successful"].append({
                        "file_id": str(file_id),
                        "filename": file_record.original_filename
                    })
                else:
                    results["failed"].append({
                        "file_id": str(file_id),
                        "error": "Failed to delete file from storage"
                    })
                    
            except Exception as e:
                results["failed"].append({
                    "file_id": str(file_id),
                    "error": str(e)
                })
        
        # Commit deletions
        if results["successful"]:
            self.db.commit()
        
        return results