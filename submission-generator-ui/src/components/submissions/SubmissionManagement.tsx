import React, { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  Paper,
  Typography,
  Alert,
  Menu,
  Divider,
  Card,
  CardContent,
  CardActions,
  Avatar,
  LinearProgress,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Assignment as SubmissionIcon,
  Visibility as ViewIcon,
  PlayArrow as StartIcon,
  CheckCircle as CompleteIcon,
  Schedule as ScheduleIcon,
  Person as ReviewIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import {
  Submission,
  SubmissionFormData,
  SubmissionStatus,
  Product,
} from "../../types";
import { useSubmissions } from "../../hooks";

interface SubmissionManagementProps {
  projectId: string;
  submissions: Submission[];
  products: Product[];
  onSubmissionsChange?: () => void;
}

const SubmissionManagement: React.FC<SubmissionManagementProps> = ({
  projectId,
  submissions,
  products,
  onSubmissionsChange,
}) => {
  const { createSubmission, updateSubmission, deleteSubmission, loading } =
    useSubmissions(projectId);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Menu state
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);

  // Form state
  const [formData, setFormData] = useState<SubmissionFormData>({
    name: "",
    submission_type: "",
    product_id: "",
    target_submission_date: "",
  });

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Menu handlers
  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    submission: Submission,
  ) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedSubmission(submission);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  // Dialog handlers
  const openCreateDialog = () => {
    resetForm();
    setCreateDialogOpen(true);
  };

  const openEditDialog = () => {
    if (selectedSubmission) {
      console.log("Opening edit dialog for submission:", selectedSubmission);
      setFormData({
        name: selectedSubmission.name,
        submission_type: selectedSubmission.submission_type || "",
        product_id: selectedSubmission.product_id,
        target_submission_date: selectedSubmission.target_submission_date || "",
      });
      setEditDialogOpen(true);
      handleMenuClose();
    } else {
      console.error("No submission selected for editing");
    }
  };

  const openDeleteDialog = () => {
    if (selectedSubmission) {
      console.log("Opening delete dialog for submission:", selectedSubmission);
      setDeleteDialogOpen(true);
      handleMenuClose();
    } else {
      console.error("No submission selected for deletion");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      submission_type: "",
      product_id: "",
      target_submission_date: "",
    });
    setError(null);
  };

  // CRUD handlers
  const handleCreateSubmission = async () => {
    try {
      setError(null);
      await createSubmission(projectId, formData);
      setCreateDialogOpen(false);
      resetForm();
      onSubmissionsChange?.();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create submission");
    }
  };

  const handleEditSubmission = async () => {
    if (!selectedSubmission) return;

    try {
      setError(null);
      console.log("=== EDIT SUBMISSION DEBUG ===");
      console.log("Selected submission:", selectedSubmission);
      console.log("Current form data:", formData);
      console.log(
        "Updating submission:",
        selectedSubmission.id,
        "with data:",
        formData,
      );
      await updateSubmission(selectedSubmission.id, formData);
      setEditDialogOpen(false);
      resetForm();
      onSubmissionsChange?.();
    } catch (err: any) {
      console.error("Error updating submission:", err);
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to update submission",
      );
    }
  };

  const handleDeleteSubmission = async () => {
    if (!selectedSubmission) return;

    try {
      setError(null);
      console.log("Deleting submission:", selectedSubmission.id);
      await deleteSubmission(selectedSubmission.id);
      setDeleteDialogOpen(false);
      onSubmissionsChange?.();
    } catch (err: any) {
      console.error("Error deleting submission:", err);
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to delete submission",
      );
    }
  };

  // Helper functions
  const getStatusColor = (
    status: SubmissionStatus,
  ):
    | "default"
    | "primary"
    | "secondary"
    | "error"
    | "info"
    | "success"
    | "warning" => {
    switch (status) {
      case SubmissionStatus.DRAFT:
        return "default";
      case SubmissionStatus.AI_PROCESSING:
        return "info";
      case SubmissionStatus.HUMAN_REVIEW:
        return "warning";
      case SubmissionStatus.SUBMITTED:
        return "success";
      case SubmissionStatus.APPROVED:
        return "success";
      case SubmissionStatus.REJECTED:
        return "error";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: SubmissionStatus) => {
    switch (status) {
      case SubmissionStatus.DRAFT:
        return <EditIcon />;
      case SubmissionStatus.AI_PROCESSING:
        return <StartIcon />;
      case SubmissionStatus.HUMAN_REVIEW:
        return <ReviewIcon />;
      case SubmissionStatus.SUBMITTED:
      case SubmissionStatus.APPROVED:
        return <CompleteIcon />;
      case SubmissionStatus.REJECTED:
        return <ScheduleIcon />;
      default:
        return <SubmissionIcon />;
    }
  };

  const getProductName = (productId: string): string => {
    const product = products.find((p) => p.id === productId);
    return product?.name || "Unknown Product";
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString();
  };

  // Empty state
  if (submissions.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <SubmissionIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No Submissions Yet
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Create your first regulatory submission to get started.
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreateDialog}
          disabled={products.length === 0}
        >
          Create Submission
        </Button>
        {products.length === 0 && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 2, display: "block" }}
          >
            You need to create at least one product before creating submissions.
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h6">Submissions ({submissions.length})</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreateDialog}
          disabled={products.length === 0}
        >
          Create Submission
        </Button>
      </Box>

      {/* Submissions Grid */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
          gap: 2,
        }}
      >
        {submissions.map((submission) => (
          <Card key={submission.id} sx={{ position: "relative" }}>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  mb: 2,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", flex: 1 }}>
                  <Avatar sx={{ bgcolor: "primary.main", mr: 2 }}>
                    {getStatusIcon(submission.status)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" component="h3">
                      {submission.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {getProductName(submission.product_id)}
                    </Typography>
                  </Box>
                </Box>

                <IconButton
                  size="small"
                  onClick={(e) => handleMenuOpen(e, submission)}
                >
                  <MoreVertIcon />
                </IconButton>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                <strong>Target Date:</strong>{" "}
                {formatDate(submission.target_submission_date)}
              </Typography>

              {submission.submission_type && (
                <Typography variant="body2" color="text.secondary" paragraph>
                  <strong>Type:</strong> {submission.submission_type}
                </Typography>
              )}

              <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                <Chip
                  label={submission.status.replace("_", " ").toUpperCase()}
                  color={getStatusColor(submission.status)}
                  size="small"
                />
              </Box>

              {submission.completion_percentage !== undefined && (
                <Box sx={{ mt: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Progress
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {submission.completion_percentage}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={submission.completion_percentage}
                    sx={{ borderRadius: 1 }}
                  />
                </Box>
              )}
            </CardContent>

            <CardActions sx={{ justifyContent: "space-between", px: 2, pb: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Created {formatDate(submission.created_at)}
              </Typography>
              <Button size="small" startIcon={<ViewIcon />}>
                View Details
              </Button>
            </CardActions>
          </Card>
        ))}
      </Box>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => console.log("View submission details")}>
          <ViewIcon sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={openEditDialog}>
          <EditIcon sx={{ mr: 1 }} />
          Edit Submission
        </MenuItem>
        <Divider />
        <MenuItem onClick={openDeleteDialog} sx={{ color: "error.main" }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete Submission
        </MenuItem>
      </Menu>

      {/* Create Submission Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Submission</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
            >
              <TextField
                label="Submission Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Health Canada Medical Device License Application"
                required
                fullWidth
              />
              <FormControl fullWidth required>
                <InputLabel>Product</InputLabel>
                <Select
                  value={formData.product_id}
                  onChange={(e) =>
                    setFormData({ ...formData, product_id: e.target.value })
                  }
                  label="Product"
                >
                  {products.map((product) => (
                    <MenuItem key={product.id} value={product.id}>
                      {product.name} ({product.device_type})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Submission Type</InputLabel>
                <Select
                  value={formData.submission_type}
                  onChange={(e) =>
                    setFormData({ ...formData, submission_type: e.target.value })
                  }
                  label="Submission Type"
                >
                  <MenuItem value="medical_device_license">Medical Device License</MenuItem>
                  <MenuItem value="ivd_license">IVD License</MenuItem>
                  <MenuItem value="medical_device_amendment">Medical Device Amendment</MenuItem>
                  <MenuItem value="ivd_amendment">IVD Amendment</MenuItem>
                </Select>
              </FormControl>
              <DatePicker
                label="Target Submission Date"
                value={
                  formData.target_submission_date
                    ? new Date(formData.target_submission_date)
                    : null
                }
                onChange={(date) =>
                  setFormData({
                    ...formData,
                    target_submission_date: date
                      ? date.toISOString().split("T")[0]
                      : "",
                  })
                }
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                }}
              />
            </Box>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setCreateDialogOpen(false)}
            disabled={loading.isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateSubmission}
            variant="contained"
            disabled={
              !formData.name.trim() || !formData.product_id || loading.isLoading
            }
          >
            {loading.isLoading ? "Creating..." : "Create Submission"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Submission Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Submission</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
            >
              <TextField
                label="Submission Name"
                value={formData.name}
                onChange={(e) => {
                  console.log('Edit dialog - Name changed to:', e.target.value);
                  setFormData({ ...formData, name: e.target.value });
                }}
                required
                fullWidth
              />
              <FormControl fullWidth required>
                <InputLabel>Product</InputLabel>
                <Select
                  value={formData.product_id}
                  onChange={(e) => {
                    console.log('Edit dialog - Product changed to:', e.target.value);
                    setFormData({ ...formData, product_id: e.target.value });
                  }}
                  label="Product"
                >
                  {products.map((product) => (
                    <MenuItem key={product.id} value={product.id}>
                      {product.name} ({product.device_type})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Submission Type</InputLabel>
                <Select
                  value={formData.submission_type}
                  onChange={(e) => {
                    console.log('Edit dialog - Submission Type changed to:', e.target.value);
                    setFormData({ ...formData, submission_type: e.target.value });
                  }}
                  label="Submission Type"
                >
                  <MenuItem value="medical_device_license">Medical Device License</MenuItem>
                  <MenuItem value="ivd_license">IVD License</MenuItem>
                  <MenuItem value="medical_device_amendment">Medical Device Amendment</MenuItem>
                  <MenuItem value="ivd_amendment">IVD Amendment</MenuItem>
                </Select>
              </FormControl>
              <DatePicker
                label="Target Submission Date"
                value={
                  formData.target_submission_date
                    ? new Date(formData.target_submission_date)
                    : null
                }
                onChange={(date) =>
                  setFormData({
                    ...formData,
                    target_submission_date: date
                      ? date.toISOString().split("T")[0]
                      : "",
                  })
                }
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                }}
              />
            </Box>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setEditDialogOpen(false)}
            disabled={loading.isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleEditSubmission}
            variant="contained"
            disabled={
              !formData.name.trim() || !formData.product_id || loading.isLoading
            }
          >
            {loading.isLoading ? "Updating..." : "Update Submission"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Submission</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedSubmission?.name}"? This
            action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={loading.isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteSubmission}
            color="error"
            variant="contained"
            disabled={loading.isLoading}
          >
            {loading.isLoading ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SubmissionManagement;
