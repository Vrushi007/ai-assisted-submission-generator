import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Menu,
  Paper,
  Avatar,
  LinearProgress,
  Alert,
  Pagination,
  Divider,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Assignment as SubmissionIcon,
  CheckCircle as CompleteIcon,
  Schedule as PendingIcon,
  Error as ErrorIcon,
  PlayArrow as ProcessingIcon,
  Person as ReviewIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import { Submission, SubmissionStatus, Project, Product } from '../../types';
import { useSubmissions, useProjects, useProducts } from '../../hooks';

const SubmissionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { submissions, loading, pagination, loadSubmissions, changePage, changePageSize } = useSubmissions();
  const { projects, loadProjects } = useProjects();
  const { products, loadProducts } = useProducts();

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | 'all'>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [productFilter, setProductFilter] = useState<string>('all');
  const [dateFromFilter, setDateFromFilter] = useState<Date | null>(null);
  const [dateToFilter, setDateToFilter] = useState<Date | null>(null);

  // UI states
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  // Load data on mount
  useEffect(() => {
    loadSubmissions();
    loadProjects();
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter submissions based on current filters
  const filteredSubmissions = submissions.filter((submission) => {
    const matchesSearch = !searchTerm || 
      submission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (submission.submission_type && submission.submission_type.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || submission.status === statusFilter;
    const matchesProject = projectFilter === 'all' || submission.project_id === projectFilter;
    const matchesProduct = productFilter === 'all' || submission.product_id === productFilter;
    
    const submissionDate = new Date(submission.created_at);
    const matchesDateFrom = !dateFromFilter || submissionDate >= dateFromFilter;
    const matchesDateTo = !dateToFilter || submissionDate <= dateToFilter;

    return matchesSearch && matchesStatus && matchesProject && matchesProduct && matchesDateFrom && matchesDateTo;
  });

  // Get statistics for status cards
  const getStatusStats = () => {
    const stats = {
      total: submissions.length,
      draft: 0,
      ai_processing: 0,
      human_review: 0,
      approved: 0,
      submitted: 0,
      rejected: 0,
    };

    submissions.forEach((submission) => {
      stats[submission.status as keyof typeof stats]++;
    });

    return stats;
  };

  const stats = getStatusStats();

  // Helper functions
  const getStatusColor = (status: SubmissionStatus): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (status) {
      case SubmissionStatus.DRAFT:
        return 'default';
      case SubmissionStatus.AI_PROCESSING:
        return 'info';
      case SubmissionStatus.HUMAN_REVIEW:
        return 'warning';
      case SubmissionStatus.SUBMITTED:
      case SubmissionStatus.APPROVED:
        return 'success';
      case SubmissionStatus.REJECTED:
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: SubmissionStatus) => {
    switch (status) {
      case SubmissionStatus.DRAFT:
        return <EditIcon />;
      case SubmissionStatus.AI_PROCESSING:
        return <ProcessingIcon />;
      case SubmissionStatus.HUMAN_REVIEW:
        return <ReviewIcon />;
      case SubmissionStatus.SUBMITTED:
      case SubmissionStatus.APPROVED:
        return <CompleteIcon />;
      case SubmissionStatus.REJECTED:
        return <ErrorIcon />;
      default:
        return <SubmissionIcon />;
    }
  };

  const getProjectName = (projectId: string): string => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Unknown Project';
  };

  const getProductName = (productId: string): string => {
    const product = products.find(p => p.id === productId);
    return product?.name || 'Unknown Product';
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  // Event handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, submission: Submission) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedSubmission(submission);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedSubmission(null);
  };

  const handleViewSubmission = () => {
    if (selectedSubmission) {
      navigate(`/submissions/${selectedSubmission.id}`);
    }
    handleMenuClose();
  };

  const handleEditSubmission = () => {
    if (selectedSubmission) {
      // Navigate to edit or open edit dialog
      console.log('Edit submission:', selectedSubmission.id);
    }
    handleMenuClose();
  };

  const handleDeleteSubmission = () => {
    if (selectedSubmission) {
      // Open delete confirmation dialog
      console.log('Delete submission:', selectedSubmission.id);
    }
    handleMenuClose();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setProjectFilter('all');
    setProductFilter('all');
    setDateFromFilter(null);
    setDateToFilter(null);
  };

  const handleCreateSubmission = () => {
    navigate('/projects'); // Navigate to projects to create submission within a project
  };

  if (loading.isLoading && submissions.length === 0) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Submissions
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">
            Submissions
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateSubmission}
          >
            New Submission
          </Button>
        </Box>

        {/* Status Overview Cards */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { 
            xs: 'repeat(2, 1fr)', 
            sm: 'repeat(3, 1fr)', 
            md: 'repeat(6, 1fr)' 
          }, 
          gap: 3, 
          mb: 4 
        }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {stats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Submissions
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="text.secondary">
                {stats.draft}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Draft
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main">
                {stats.ai_processing}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                AI Processing
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">
                {stats.human_review}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Under Review
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                {stats.approved + stats.submitted}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Approved/Submitted
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="error.main">
                {stats.rejected}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Rejected
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Filters */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <FilterIcon />
            <Typography variant="h6">Filters</Typography>
            <Button size="small" onClick={clearFilters}>
              Clear All
            </Button>
          </Box>
          
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { 
              xs: '1fr', 
              sm: 'repeat(2, 1fr)', 
              md: '3fr 2fr 2fr 2fr 1.5fr 1.5fr' 
            }, 
            gap: 2 
          }}>
            <TextField
              fullWidth
              placeholder="Search submissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as SubmissionStatus | 'all')}
                label="Status"
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value={SubmissionStatus.DRAFT}>Draft</MenuItem>
                <MenuItem value={SubmissionStatus.AI_PROCESSING}>AI Processing</MenuItem>
                <MenuItem value={SubmissionStatus.HUMAN_REVIEW}>Under Review</MenuItem>
                <MenuItem value={SubmissionStatus.APPROVED}>Approved</MenuItem>
                <MenuItem value={SubmissionStatus.SUBMITTED}>Submitted</MenuItem>
                <MenuItem value={SubmissionStatus.REJECTED}>Rejected</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Project</InputLabel>
              <Select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                label="Project"
              >
                <MenuItem value="all">All Projects</MenuItem>
                {projects.map((project) => (
                  <MenuItem key={project.id} value={project.id}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Product</InputLabel>
              <Select
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                label="Product"
              >
                <MenuItem value="all">All Products</MenuItem>
                {products.map((product) => (
                  <MenuItem key={product.id} value={product.id}>
                    {product.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <DatePicker
              label="From Date"
              value={dateFromFilter}
              onChange={(date) => setDateFromFilter(date)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: 'medium',
                },
              }}
            />
            <DatePicker
              label="To Date"
              value={dateToFilter}
              onChange={(date) => setDateToFilter(date)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: 'medium',
                },
              }}
            />
          </Box>
        </Paper>

        {/* Loading State */}
        {loading.isLoading && (
          <LinearProgress sx={{ mb: 2 }} />
        )}

        {/* Error State */}
        {loading.error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {loading.error}
          </Alert>
        )}

        {/* Results Summary */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="body1">
            Showing {filteredSubmissions.length} of {submissions.length} submissions
          </Typography>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Per Page</InputLabel>
            <Select
              value={pagination.size}
              onChange={(e) => changePageSize(Number(e.target.value))}
              label="Per Page"
            >
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={20}>20</MenuItem>
              <MenuItem value={50}>50</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Submissions List */}
        {filteredSubmissions.length === 0 ? (
          <Paper sx={{ p: 8, textAlign: 'center' }}>
            <SubmissionIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No submissions found
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {searchTerm || statusFilter !== 'all' || projectFilter !== 'all' || productFilter !== 'all' || dateFromFilter || dateToFilter
                ? 'Try adjusting your filters to see more results.'
                : 'Create your first submission to get started.'
              }
            </Typography>
            {!(searchTerm || statusFilter !== 'all' || projectFilter !== 'all' || productFilter !== 'all' || dateFromFilter || dateToFilter) && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateSubmission}>
                Create Submission
              </Button>
            )}
          </Paper>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 2 }}>
            {filteredSubmissions.map((submission) => (
              <Card key={submission.id} sx={{ cursor: 'pointer' }} onClick={() => navigate(`/submissions/${submission.id}`)}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                      <Avatar sx={{ bgcolor: getStatusColor(submission.status) === 'default' ? 'grey.500' : `${getStatusColor(submission.status)}.main`, mr: 2 }}>
                        {getStatusIcon(submission.status)}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" component="h3">
                          {submission.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {getProjectName(submission.project_id)}
                        </Typography>
                      </Box>
                    </Box>

                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMenuOpen(e, submission);
                      }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    <strong>Product:</strong> {getProductName(submission.product_id)}
                  </Typography>

                  {submission.submission_type && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <strong>Type:</strong> {submission.submission_type}
                    </Typography>
                  )}

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    <strong>Target Date:</strong> {submission.target_submission_date ? formatDate(submission.target_submission_date) : 'Not set'}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip
                      label={submission.status.replace('_', ' ').toUpperCase()}
                      color={getStatusColor(submission.status)}
                      size="small"
                    />
                  </Box>

                  {submission.completion_percentage !== undefined && (
                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
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

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="caption" color="text.secondary">
                    Created {formatDate(submission.created_at)}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}

        {/* Pagination */}
        {filteredSubmissions.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination
              count={pagination.pages}
              page={pagination.page}
              onChange={(_, page) => changePage(page)}
              color="primary"
            />
          </Box>
        )}

        {/* Context Menu */}
        <Menu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleViewSubmission}>
            <ViewIcon sx={{ mr: 1 }} />
            View Details
          </MenuItem>
          <MenuItem onClick={handleEditSubmission}>
            <EditIcon sx={{ mr: 1 }} />
            Edit Submission
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleDeleteSubmission} sx={{ color: 'error.main' }}>
            <DeleteIcon sx={{ mr: 1 }} />
            Delete Submission
          </MenuItem>
        </Menu>
      </Box>
    </LocalizationProvider>
  );
};

export default SubmissionsPage;