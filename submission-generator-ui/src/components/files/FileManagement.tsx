import React, { useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Chip,
  Avatar,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Paper,
  InputAdornment,
} from "@mui/material";
import {
  Upload as UploadIcon,
  AttachFile as FileIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Description as DocumentIcon,
  TableChart as SpreadsheetIcon,
  PictureAsPdf as PdfIcon,
  InsertDriveFile as GenericFileIcon,
  CloudUpload as CloudUploadIcon,
  CheckCircle as CompleteIcon,
  Error as ErrorIcon,
  Schedule as PendingIcon,
  Psychology as AIIcon,
  AutoAwesome as AutoIcon,
  Visibility as ViewIcon,
} from "@mui/icons-material";
import { useDropzone } from "react-dropzone";

import { UploadedFile, FileType, Submission } from "../../types";
import { useFiles } from "../../hooks";
import { useAI } from "../../hooks/useAI";

interface FileManagementProps {
  projectId: string;
  files: UploadedFile[];
  submissions: Submission[];
  onFilesChange?: () => void;
}

const FileManagement: React.FC<FileManagementProps> = ({
  projectId,
  files,
  submissions,
  onFilesChange,
}) => {
  const {
    uploadFile,
    uploadMultipleFiles,
    deleteFile,
    downloadFile,
    uploadProgress,
    clearUploadProgress,
  } = useFiles();

  const {
    processFile,
    extractText,
    autoPopulate,
    processing: aiProcessing,
    error: aiError,
  } = useAI();

  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState<FileType | "all">("all");
  const [submissionFilter, setSubmissionFilter] = useState<string>("all");
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string>("");
  const [uploadPurpose, setUploadPurpose] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Filter files
  const filteredFiles = files.filter((file) => {
    const matchesSearch =
      !searchTerm ||
      file.original_filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (file.upload_purpose &&
        file.upload_purpose.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFileType =
      fileTypeFilter === "all" || file.file_type === fileTypeFilter;
    const matchesSubmission =
      submissionFilter === "all" || file.submission_id === submissionFilter;

    return matchesSearch && matchesFileType && matchesSubmission;
  });

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileDrop,
    multiple: true,
    maxSize: 50 * 1024 * 1024, // 50MB
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "text/plain": [".txt"],
      "image/*": [".png", ".jpg", ".jpeg", ".gif"],
    },
  });

  // Event handlers
  async function handleFileDrop(acceptedFiles: File[]) {
    if (acceptedFiles.length === 0) return;

    setIsUploading(true);
    setError(null);

    try {
      if (acceptedFiles.length === 1) {
        await uploadFile(
          acceptedFiles[0],
          projectId,
          selectedSubmissionId || undefined,
          uploadPurpose || undefined,
          "Current User",
        );
      } else {
        await uploadMultipleFiles(
          acceptedFiles,
          projectId,
          selectedSubmissionId || undefined,
        );
      }

      onFilesChange?.();
      setUploadDialogOpen(false);
      resetUploadForm();
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    file: UploadedFile,
  ) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedFile(file);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleDownloadFile = async () => {
    if (!selectedFile) return;

    try {
      await downloadFile(selectedFile.id, selectedFile.original_filename);
      handleMenuClose();
    } catch (err: any) {
      setError(err.message || "Download failed");
    }
  };

  const handleDeleteFile = async () => {
    if (!selectedFile) return;

    try {
      setError(null);
      await deleteFile(selectedFile.id);
      onFilesChange?.();
      setDeleteDialogOpen(false);
      handleMenuClose();
    } catch (err: any) {
      setError(err.message || "Delete failed");
    }
  };

  const openDeleteDialog = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleProcessWithAI = async () => {
    if (!selectedFile) return;

    try {
      setError(null);
      const result = await processFile(
        selectedFile.id,
        selectedFile.submission_id || "",
        { auto_populate: true },
      );

      if (result) {
        setError(null);
        // Show success message
        console.log("AI Processing completed:", result);
      }

      handleMenuClose();
      onFilesChange?.();
    } catch (err: any) {
      setError(err.message || "AI processing failed");
    }
  };

  const handleExtractText = async () => {
    if (!selectedFile) return;

    try {
      setError(null);
      const result = await extractText(selectedFile.id);

      if (result) {
        // Could open a dialog to show extracted text
        console.log("Extracted text:", result.extracted_content);
        alert(
          `Text extracted successfully! ${result.extracted_content.text.substring(0, 200)}...`,
        );
      }

      handleMenuClose();
    } catch (err: any) {
      setError(err.message || "Text extraction failed");
    }
  };

  const handleAutoPopulate = async () => {
    if (!selectedSubmissionId) return;

    try {
      setError(null);
      const result = await autoPopulate(selectedSubmissionId);

      if (result && result.background_processing) {
        // Show success message for background processing
        alert(
          `🤖 ${result.message}\n\n📋 Next Steps:\n• Go to the 'Dossier' tab to see live progress\n• Sections will update automatically as AI processes them\n• You can continue working while AI runs in the background`,
        );
        onFilesChange?.();
      } else if (result) {
        // Fallback for immediate processing
        alert(
          `Auto-population completed! ${result.sections_updated} sections updated from ${result.files_processed} files.`,
        );
        onFilesChange?.();
      }
    } catch (err: any) {
      setError(err.message || "Auto-population failed");
    }
  };

  const resetUploadForm = () => {
    setSelectedSubmissionId("");
    setUploadPurpose("");
    setError(null);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFileTypeFilter("all");
    setSubmissionFilter("all");
  };

  // Helper functions
  const getFileIcon = (fileType: FileType) => {
    switch (fileType) {
      case FileType.PDF:
        return <PdfIcon />;
      case FileType.DOCX:
        return <DocumentIcon />;
      case FileType.XLSX:
        return <SpreadsheetIcon />;
      default:
        return <GenericFileIcon />;
    }
  };

  const getFileTypeColor = (
    fileType: FileType,
  ):
    | "default"
    | "primary"
    | "secondary"
    | "error"
    | "info"
    | "success"
    | "warning" => {
    switch (fileType) {
      case FileType.PDF:
        return "error";
      case FileType.DOCX:
        return "primary";
      case FileType.XLSX:
        return "success";
      default:
        return "default";
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  const getSubmissionName = (submissionId?: string): string => {
    if (!submissionId) return "Project Files";
    const submission = submissions.find((s) => s.id === submissionId);
    return submission?.name || "Unknown Submission";
  };

  // Debug logging
  console.log("FileManagement render - files.length:", files.length);
  console.log("FileManagement render - uploadDialogOpen:", uploadDialogOpen);
  console.log("Rendering files content - files.length:", files.length);

  // Log which branch will be taken
  if (filteredFiles.length === 0 && files.length > 0) {
    console.log("Will render: No filtered results");
  } else if (files.length > 0) {
    console.log("Will render: Files grid");
  } else {
    console.log("Will render: Empty state");
  }

  return (
    <>
      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Upload Files</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mb: 3 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Associate with Submission (Optional)</InputLabel>
              <Select
                value={selectedSubmissionId}
                onChange={(e) => setSelectedSubmissionId(e.target.value)}
                label="Associate with Submission (Optional)"
              >
                <MenuItem value="">Project Files (No Submission)</MenuItem>
                {submissions.map((submission) => (
                  <MenuItem key={submission.id} value={submission.id}>
                    {submission.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Upload Purpose (Optional)"
              value={uploadPurpose}
              onChange={(e) => setUploadPurpose(e.target.value)}
              placeholder="e.g., Clinical Data, Device Specifications, Test Results"
              fullWidth
            />
          </Box>

          <Paper
            {...getRootProps()}
            sx={{
              p: 4,
              textAlign: "center",
              border: "2px dashed",
              borderColor: isDragActive ? "primary.main" : "grey.300",
              bgcolor: isDragActive ? "primary.50" : "background.paper",
              cursor: "pointer",
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor: "primary.main",
                bgcolor: "primary.50",
              },
            }}
          >
            <input {...getInputProps()} />
            <CloudUploadIcon
              sx={{
                fontSize: 48,
                color: isDragActive ? "primary.main" : "text.secondary",
                mb: 2,
              }}
            />
            <Typography variant="h6" gutterBottom>
              {isDragActive ? "Drop files here" : "Drag & drop files here"}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              or click to browse files
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Supported: PDF, Word, Excel, Images, Text files (Max 50MB each)
            </Typography>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setUploadDialogOpen(false)}
            disabled={isUploading}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete File</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedFile?.original_filename}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteFile} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <Box>
        {/* Context Menu */}
        <Menu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleDownloadFile}>
            <DownloadIcon sx={{ mr: 1 }} />
            Download
          </MenuItem>
          <MenuItem onClick={handleProcessWithAI}>
            <AIIcon sx={{ mr: 1 }} />
            Process with AI
          </MenuItem>
          <MenuItem onClick={handleExtractText}>
            <ViewIcon sx={{ mr: 1 }} />
            Extract Text
          </MenuItem>
          <Divider />
          <MenuItem onClick={openDeleteDialog} sx={{ color: "error.main" }}>
            <DeleteIcon sx={{ mr: 1 }} />
            Delete File
          </MenuItem>
        </Menu>

        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h6">
            Files ({filteredFiles.length} of {files.length})
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<UploadIcon />}
              onClick={() => {
                console.log("Upload button clicked - setting dialog to true");
                setUploadDialogOpen(true);
              }}
            >
              Upload Files
            </Button>
            {selectedSubmissionId && (
              <Button
                variant="outlined"
                startIcon={<AutoIcon />}
                onClick={handleAutoPopulate}
                disabled={aiProcessing}
              >
                AI Auto-Populate
              </Button>
            )}
          </Box>
        </Box>

        {/* Upload Progress */}
        {uploadProgress.length > 0 && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h6">Upload Progress</Typography>
                <Button size="small" onClick={clearUploadProgress}>
                  Clear
                </Button>
              </Box>
              {uploadProgress.map((progress, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography variant="body2">
                      {progress.file.name}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {progress.status === "completed" && (
                        <CompleteIcon color="success" fontSize="small" />
                      )}
                      {progress.status === "error" && (
                        <ErrorIcon color="error" fontSize="small" />
                      )}
                      {progress.status === "uploading" && (
                        <PendingIcon color="info" fontSize="small" />
                      )}
                      <Typography variant="caption">
                        {progress.status === "completed"
                          ? "Complete"
                          : progress.status === "error"
                            ? "Failed"
                            : `${progress.progress}%`}
                      </Typography>
                    </Box>
                  </Box>
                  {progress.status === "uploading" && (
                    <LinearProgress
                      variant="determinate"
                      value={progress.progress}
                    />
                  )}
                  {progress.error && (
                    <Typography variant="caption" color="error">
                      {progress.error}
                    </Typography>
                  )}
                </Box>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <FilterIcon />
            <Typography variant="subtitle1">Filters</Typography>
            <Button size="small" onClick={clearFilters}>
              Clear
            </Button>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
              gap: 2,
            }}
          >
            <TextField
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>File Type</InputLabel>
              <Select
                value={fileTypeFilter}
                onChange={(e) =>
                  setFileTypeFilter(e.target.value as FileType | "all")
                }
                label="File Type"
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value={FileType.PDF}>PDF</MenuItem>
                <MenuItem value={FileType.DOCX}>Word Document</MenuItem>
                <MenuItem value={FileType.XLSX}>Excel Spreadsheet</MenuItem>
                <MenuItem value={FileType.OTHER}>Other</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Submission</InputLabel>
              <Select
                value={submissionFilter}
                onChange={(e) => setSubmissionFilter(e.target.value)}
                label="Submission"
              >
                <MenuItem value="all">All Files</MenuItem>
                <MenuItem value="">Project Files (No Submission)</MenuItem>
                {submissions.map((submission) => (
                  <MenuItem key={submission.id} value={submission.id}>
                    {submission.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Paper>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Files Content */}
        {filteredFiles.length === 0 && files.length > 0 ? (
          // No filtered results (but files exist)
          <Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>
            <FileIcon sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No files match your filters
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Try adjusting your search terms or filters.
            </Typography>
            <Button size="small" onClick={clearFilters}>
              Clear Filters
            </Button>
          </Paper>
        ) : files.length > 0 ? (
          // Files grid (when files exist)
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
              gap: 2,
            }}
          >
            {filteredFiles.map((file) => (
              <Card key={file.id} sx={{ position: "relative" }}>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      mb: 2,
                    }}
                  >
                    <Box
                      sx={{ display: "flex", alignItems: "center", flex: 1 }}
                    >
                      <Avatar
                        sx={{
                          bgcolor: `${getFileTypeColor(file.file_type)}.main`,
                          mr: 2,
                        }}
                      >
                        {getFileIcon(file.file_type)}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="subtitle1"
                          noWrap
                          title={file.original_filename}
                        >
                          {file.original_filename}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatFileSize(file.file_size)} •{" "}
                          {formatDate(file.created_at)}
                        </Typography>
                      </Box>
                    </Box>

                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, file)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>

                  <Box
                    sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}
                  >
                    <Chip
                      label={file.file_type.toUpperCase()}
                      color={getFileTypeColor(file.file_type)}
                      size="small"
                    />
                    {file.is_processed && (
                      <Chip
                        label="AI Processed"
                        color="success"
                        size="small"
                        icon={<CompleteIcon />}
                      />
                    )}
                  </Box>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    <strong>Associated with:</strong>{" "}
                    {getSubmissionName(file.submission_id)}
                  </Typography>

                  {file.upload_purpose && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      <strong>Purpose:</strong> {file.upload_purpose}
                    </Typography>
                  )}

                  {file.uploaded_by && (
                    <Typography variant="body2" color="text.secondary">
                      <strong>Uploaded by:</strong> {file.uploaded_by}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        ) : (
          // Empty state (only when no files at all) - MOVED TO END
          <Box sx={{ textAlign: "center", py: 8 }}>
            <CloudUploadIcon
              sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}
            />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Files Uploaded Yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Upload documents, images, and other files to support your
              submissions.
            </Typography>
            <Button
              variant="contained"
              startIcon={<UploadIcon />}
              onClick={() => {
                console.log("Empty state upload button clicked");
                setUploadDialogOpen(true);
              }}
            >
              Upload Files
            </Button>
          </Box>
        )}
      </Box>
    </>
  );
};

export default FileManagement;
