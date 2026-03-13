import { useState, useCallback } from 'react';
import { UploadedFile, PaginatedResponse, FileUploadProgress, BatchUploadResult } from '../types';
import { apiService } from '../services/api';
import { useApp } from '../contexts/AppContext';

export const useFiles = () => {
  const { setLoading } = useApp();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    size: 10,
    total: 0,
    pages: 0,
  });

  const loadFiles = useCallback(async (
    projectId?: string, 
    submissionId?: string, 
    page = 1, 
    size = 10
  ) => {
    try {
      setLoading('files', true);
      const response: PaginatedResponse<UploadedFile> = await apiService.getFiles(
        projectId, 
        submissionId, 
        page, 
        size
      );
      
      setFiles(response.items);
      setPagination({
        page: response.page,
        size: response.size,
        total: response.total,
        pages: response.pages,
      });
      
      setLoading('files', false);
      return response;
    } catch (error) {
      console.error('Error loading files:', error);
      setLoading('files', false, 'Failed to load files');
      throw error;
    }
  }, [setLoading]);

  const uploadFile = useCallback(async (
    file: File,
    projectId: string,
    submissionId?: string,
    uploadPurpose?: string,
    uploadedBy?: string
  ): Promise<UploadedFile> => {
    const progressItem: FileUploadProgress = {
      file,
      progress: 0,
      status: 'pending',
    };

    setUploadProgress(prev => [...prev, progressItem]);

    try {
      progressItem.status = 'uploading';
      setUploadProgress(prev => [...prev.filter(p => p.file !== file), progressItem]);

      const uploadedFile = await apiService.uploadFile(
        file,
        projectId,
        submissionId,
        uploadPurpose,
        uploadedBy,
        (progress) => {
          progressItem.progress = progress;
          setUploadProgress(prev => [...prev.filter(p => p.file !== file), progressItem]);
        }
      );

      progressItem.status = 'completed';
      progressItem.result = uploadedFile;
      setUploadProgress(prev => [...prev.filter(p => p.file !== file), progressItem]);

      // Add to files list
      setFiles(prev => [uploadedFile, ...prev]);

      return uploadedFile;
    } catch (error) {
      console.error('Error uploading file:', error);
      progressItem.status = 'error';
      progressItem.error = error instanceof Error ? error.message : 'Upload failed';
      setUploadProgress(prev => [...prev.filter(p => p.file !== file), progressItem]);
      throw error;
    }
  }, []);

  const uploadMultipleFiles = useCallback(async (
    filesToUpload: File[],
    projectId: string,
    submissionId?: string
  ): Promise<BatchUploadResult> => {
    // Initialize progress for all files
    const progressItems: FileUploadProgress[] = filesToUpload.map(file => ({
      file,
      progress: 0,
      status: 'pending',
    }));

    setUploadProgress(prev => [...prev, ...progressItems]);

    try {
      // Update all to uploading status
      progressItems.forEach(item => {
        item.status = 'uploading';
      });
      setUploadProgress(prev => [
        ...prev.filter(p => !filesToUpload.includes(p.file)),
        ...progressItems
      ]);

      const result = await apiService.uploadMultipleFiles(
        filesToUpload,
        projectId,
        submissionId,
        (progress) => {
          // Update overall progress
          progressItems.forEach(item => {
            item.progress = progress;
          });
          setUploadProgress(prev => [
            ...prev.filter(p => !filesToUpload.includes(p.file)),
            ...progressItems
          ]);
        }
      );

      // Update progress based on results
      progressItems.forEach(item => {
        const successful = result.successful.find(s => s.filename === item.file.name);
        if (successful) {
          item.status = 'completed';
        } else {
          item.status = 'error';
          const failed = result.failed.find(f => f.filename === item.file.name);
          item.error = failed?.error || 'Upload failed';
        }
      });

      setUploadProgress(prev => [
        ...prev.filter(p => !filesToUpload.includes(p.file)),
        ...progressItems
      ]);

      // Reload files list
      await loadFiles(projectId, submissionId);

      return result;
    } catch (error) {
      console.error('Error uploading files:', error);
      progressItems.forEach(item => {
        item.status = 'error';
        item.error = error instanceof Error ? error.message : 'Upload failed';
      });
      setUploadProgress(prev => [
        ...prev.filter(p => !filesToUpload.includes(p.file)),
        ...progressItems
      ]);
      throw error;
    }
  }, [loadFiles]);

  const deleteFile = useCallback(async (fileId: string): Promise<void> => {
    try {
      await apiService.deleteFile(fileId);
      setFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }, []);

  const downloadFile = useCallback(async (fileId: string, filename: string): Promise<void> => {
    try {
      const blob = await apiService.downloadFile(fileId);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }, []);

  const validateFile = useCallback(async (file: File, maxSizeMB?: number) => {
    try {
      const validation = await apiService.validateFileUpload(file, maxSizeMB);
      return validation;
    } catch (error) {
      console.error('Error validating file:', error);
      throw error;
    }
  }, []);

  const clearUploadProgress = useCallback(() => {
    setUploadProgress([]);
  }, []);

  const removeUploadProgress = useCallback((file: File) => {
    setUploadProgress(prev => prev.filter(p => p.file !== file));
  }, []);

  const changePage = useCallback(async (newPage: number, projectId?: string, submissionId?: string) => {
    await loadFiles(projectId, submissionId, newPage, pagination.size);
  }, [loadFiles, pagination.size]);

  const changePageSize = useCallback(async (newSize: number, projectId?: string, submissionId?: string) => {
    await loadFiles(projectId, submissionId, 1, newSize);
  }, [loadFiles]);

  return {
    files,
    uploadProgress,
    pagination,
    
    // Actions
    loadFiles,
    uploadFile,
    uploadMultipleFiles,
    deleteFile,
    downloadFile,
    validateFile,
    changePage,
    changePageSize,
    
    // Upload progress management
    clearUploadProgress,
    removeUploadProgress,
  };
};

export default useFiles;