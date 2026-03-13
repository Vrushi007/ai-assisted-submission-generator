"""
Background task processing for AI operations.
"""

import asyncio
import time
from typing import List, Dict, Any, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from concurrent.futures import ThreadPoolExecutor
import threading

from app.core.database import get_db
from app.ai.services import AIProcessingService
from app.files.models import UploadedFile
from app.dossier.models import DossierSection


class BackgroundTaskManager:
    """Manages background AI processing tasks."""
    
    def __init__(self):
        self.active_tasks: Dict[str, Dict[str, Any]] = {}
        self.task_results: Dict[str, Dict[str, Any]] = {}
        self.executor = ThreadPoolExecutor(max_workers=3)  # Limit concurrent AI calls
        self._lock = threading.Lock()
    
    def start_auto_populate_task(self, submission_id: UUID) -> str:
        """Start background auto-population task and return task ID."""
        
        task_id = f"auto_populate_{submission_id}_{int(time.time())}"
        
        with self._lock:
            self.active_tasks[task_id] = {
                "task_id": task_id,
                "submission_id": str(submission_id),
                "status": "starting",
                "progress": 0,
                "total_files": 0,
                "processed_files": 0,
                "total_sections": 0,
                "processed_sections": 0,
                "updated_sections": [],
                "errors": [],
                "started_at": time.time()
            }
        
        # Start background processing
        future = self.executor.submit(self._process_auto_populate, task_id, submission_id)
        
        return task_id
    
    def get_task_status(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Get current status of a background task."""
        with self._lock:
            if task_id in self.active_tasks:
                return self.active_tasks[task_id].copy()
            elif task_id in self.task_results:
                return self.task_results[task_id].copy()
            return None
    
    def _process_auto_populate(self, task_id: str, submission_id: UUID):
        """Process auto-population in background thread."""
        
        try:
            # Get database session
            db = next(get_db())
            ai_service = AIProcessingService(db)
            
            # Update status
            self._update_task_status(task_id, "running", "Fetching files...")
            
            # Get all files for this submission
            files = db.query(UploadedFile).filter(
                UploadedFile.submission_id == submission_id
            ).all()
            
            if not files:
                self._complete_task(task_id, {
                    "message": "No files found for this submission",
                    "sections_updated": 0,
                    "files_processed": 0
                })
                return
            
            # Update task with file count
            with self._lock:
                self.active_tasks[task_id]["total_files"] = len(files)
            
            total_updated = []
            processed_files = 0
            
            # Process each file
            for i, file_record in enumerate(files):
                try:
                    self._update_task_status(
                        task_id, 
                        "running", 
                        f"Processing file {i+1}/{len(files)}: {file_record.original_filename}"
                    )
                    
                    response = ai_service.process_uploaded_file(
                        file_id=file_record.id,
                        submission_id=submission_id,
                        auto_populate=True
                    )
                    
                    if response.extraction_result.success:
                        total_updated.extend(response.sections_updated)
                        processed_files += 1
                        
                        # Update progress
                        with self._lock:
                            self.active_tasks[task_id]["processed_files"] = processed_files
                            self.active_tasks[task_id]["updated_sections"] = list(set(total_updated))
                            self.active_tasks[task_id]["progress"] = int((i + 1) / len(files) * 100)
                    else:
                        with self._lock:
                            self.active_tasks[task_id]["errors"].append(
                                f"Failed to process {file_record.original_filename}: {response.extraction_result.error_message}"
                            )
                        
                except Exception as e:
                    error_msg = f"Error processing file {file_record.original_filename}: {str(e)}"
                    print(error_msg)
                    with self._lock:
                        self.active_tasks[task_id]["errors"].append(error_msg)
                    continue
            
            # Complete task
            unique_updated = list(set(total_updated))
            self._complete_task(task_id, {
                "message": f"Auto-population completed: {len(unique_updated)} sections updated from {processed_files} files",
                "sections_updated": len(unique_updated),
                "files_processed": processed_files,
                "updated_section_ids": [str(sid) for sid in unique_updated],
                "errors": self.active_tasks[task_id]["errors"]
            })
            
            db.close()
            
        except Exception as e:
            error_msg = f"Auto-population failed: {str(e)}"
            print(error_msg)
            self._complete_task(task_id, {
                "message": error_msg,
                "sections_updated": 0,
                "files_processed": 0,
                "error": str(e)
            })
    
    def _update_task_status(self, task_id: str, status: str, message: str = ""):
        """Update task status."""
        with self._lock:
            if task_id in self.active_tasks:
                self.active_tasks[task_id]["status"] = status
                self.active_tasks[task_id]["current_message"] = message
                self.active_tasks[task_id]["last_updated"] = time.time()
    
    def _complete_task(self, task_id: str, result: Dict[str, Any]):
        """Mark task as completed and move to results."""
        with self._lock:
            if task_id in self.active_tasks:
                task_data = self.active_tasks[task_id]
                task_data["status"] = "completed"
                task_data["completed_at"] = time.time()
                task_data["result"] = result
                
                # Move to results and remove from active
                self.task_results[task_id] = task_data
                del self.active_tasks[task_id]
    
    def cleanup_old_tasks(self, max_age_hours: int = 24):
        """Clean up old completed tasks."""
        current_time = time.time()
        max_age_seconds = max_age_hours * 3600
        
        with self._lock:
            # Clean up old results
            expired_results = [
                task_id for task_id, task_data in self.task_results.items()
                if current_time - task_data.get("completed_at", 0) > max_age_seconds
            ]
            
            for task_id in expired_results:
                del self.task_results[task_id]


# Global task manager instance
background_task_manager = BackgroundTaskManager()