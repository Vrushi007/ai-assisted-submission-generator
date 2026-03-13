import React, { useCallback, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  InsertDriveFile as FileIcon,
  Delete as DeleteIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';

import { FileUploadProgress } from '../../types';
import { useFiles } from '../../hooks';

interface FileUploadProps {
  projectId: string;
  submissionId?: string;
  onUploadComplete?: (files: any[]) => void;
  onUploadError?: (error: string) => void;
  accept?: Record<string, string[]>;
  maxFiles?: number;
  maxSize?: number; // in bytes
  disabled?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  projectId,
  submissionId,
  onUploadComplete,
  onUploadError,
  accept = {
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'text/plain': ['.txt'],
    'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
  },
  maxFiles = 10,
  maxSize = 50 * 1024 * 1024, // 50MB
  disabled = false,
}) => {
  const { uploadFile, uploadMultipleFiles, uploadProgress, removeUploadProgress } = useFiles();
  const [dragActive, setDragActive] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    try {
      if (acceptedFiles.length === 1) {
        // Single file upload
        const result = await uploadFile(
          acceptedFiles[0],
          projectId,
          submissionId,
          'document_upload'
        );
        if (onUploadComplete) {
          onUploadComplete([result]);
        }
      } else {
        // Multiple file upload
        const result = await uploadMultipleFiles(
          acceptedFiles,
          projectId,
          submissionId
        );
        if (onUploadComplete) {
          onUploadComplete(result.successful);
        }
        if (result.failed.length > 0 && onUploadError) {
          onUploadError(`${result.failed.length} files failed to upload`);
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      if (onUploadError) {
        onUploadError(error instanceof Error ? error.message : 'Upload failed');
      }
    }
  }, [projectId, submissionId, uploadFile, uploadMultipleFiles, onUploadComplete, onUploadError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles,
    maxSize,
    disabled,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
  });

  const getProgressColor = (progress: FileUploadProgress) => {
    switch (progress.status) {
      case 'completed':
        return 'success';
      case 'error':
        return 'error';
      case 'uploading':
        return 'primary';
      default:
        return 'primary';
    }
  };

  const getProgressIcon = (progress: FileUploadProgress) => {
    switch (progress.status) {
      case 'completed':
        return <SuccessIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return <FileIcon />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box>
      {/* Upload Area */}
      <Card
        sx={{
          border: '2px dashed',
          borderColor: dragActive || isDragActive ? 'primary.main' : 'grey.300',
          backgroundColor: dragActive || isDragActive ? 'action.hover' : 'background.paper',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            borderColor: disabled ? 'grey.300' : 'primary.main',
            backgroundColor: disabled ? 'background.paper' : 'action.hover',
          },
        }}
      >
        <CardContent>
          <Box
            {...getRootProps()}
            sx={{
              textAlign: 'center',
              py: 4,
              px: 2,
            }}
          >
            <input {...getInputProps()} />
            <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              or click to browse files
            </Typography>
            <Button
              variant="outlined"
              disabled={disabled}
              sx={{ mt: 1 }}
            >
              Choose Files
            </Button>
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Max {maxFiles} files, {formatFileSize(maxSize)} each
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Upload Progress
            </Typography>
            <List dense>
              {uploadProgress.map((progress, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    {getProgressIcon(progress)}
                  </ListItemIcon>
                  <ListItemText
                    primary={progress.file.name}
                    secondary={
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="caption">
                            {formatFileSize(progress.file.size)}
                          </Typography>
                          <Chip
                            label={progress.status}
                            size="small"
                            color={getProgressColor(progress) as any}
                            variant="outlined"
                          />
                        </Box>
                        {progress.status === 'uploading' && (
                          <LinearProgress
                            variant="determinate"
                            value={progress.progress}
                            sx={{ width: '100%' }}
                          />
                        )}
                        {progress.status === 'error' && progress.error && (
                          <Alert severity="error" sx={{ mt: 1 }}>
                            {progress.error}
                          </Alert>
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => removeUploadProgress(progress.file)}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default FileUpload;