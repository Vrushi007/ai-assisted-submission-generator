import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  IconButton,
  Tabs,
  Tab,
  Alert,
  LinearProgress,
  Breadcrumbs,
  Link,
  Divider,
  Avatar,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Assignment as SubmissionIcon,
  CheckCircle as CompleteIcon,
  Schedule as PendingIcon,
  Error as ErrorIcon,
  PlayArrow as ProcessingIcon,
  Person as ReviewIcon,
  Folder as DossierIcon,
  AttachFile as FileIcon,
  Timeline as TimelineIcon,
  Build as BuildIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Assessment as ReportIcon,
  Schedule as ScheduleIcon,
  Psychology as AIIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import { Submission, SubmissionStatus, SubmissionFormData, Project, Product, UploadedFile, HumanReview } from '../../types';
import { useSubmissions, useProjects, useProducts, useFiles } from '../../hooks';
import { LoadingSpinner } from '../../components/common';
import { DossierStructure } from '../../components/dossier';
import { AIDashboard } from '../../components/ai';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`submission-tabpanel-${index}`}
      aria-labelledby={`submission-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const SubmissionDetailsPage: React.FC = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  
  const { getSubmission, updateSubmission, deleteSubmission, loading } = useSubmissions();
  const { projects, loadProjects } = useProjects();
  const { products, loadProducts } = useProducts();
  const { files, loadFiles } = useFiles();

  // State
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state for editing
  const [formData, setFormData] = useState<SubmissionFormData>({
    name: '',
    submission_type: '',
    product_id: '',
    target_submission_date: '',
  });

  // Load data
  useEffect(() => {
    if (submissionId) {
      loadSubmissionData();
      loadProjects();
      loadProducts();
      loadFiles(undefined, submissionId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissionId]);

  const loadSubmissionData = async () => {
    if (!submissionId) return;
    
    try {
      const submissionData = await getSubmission(submissionId);
      setSubmission(submissionData);
      
      // Set form data for editing
      setFormData({
        name: submissionData.name,
        submission_type: submissionData.submission_type || '',
        product_id: submissionData.product_id,
        target_submission_date: submissionData.target_submission_date || '',
      });
    } catch (err: any) {
      setError('Failed to load submission details');
    }
  };

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

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  // Event handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleEditSubmission = async () => {
    if (!submission) return;

    try {
      setError(null);
      const updatedSubmission = await updateSubmission(submission.id, formData);
      setSubmission(updatedSubmission);
      setEditDialogOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update submission');
    }
  };

  const handleDeleteSubmission = async () => {
    if (!submission) return;

    try {
      setError(null);
      await deleteSubmission(submission.id);
      navigate('/submissions');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete submission');
    }
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const openEditDialog = () => {
    setEditDialogOpen(true);
    handleMenuClose();
  };

  const openDeleteDialog = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  // Loading state
  if (loading.isLoading && !submission) {
    return (
      <Box>
        <LoadingSpinner />
      </Box>
    );
  }

  // Error state
  if (error && !submission) {
    return (
      <Box>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  // Not found state
  if (!submission) {
    return (
      <Box>
        <Alert severity="warning">Submission not found</Alert>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => navigate('/submissions')} sx={{ mr: 2 }}>
            <BackIcon />
          </IconButton>
          
          <Box sx={{ flex: 1 }}>
            <Breadcrumbs sx={{ mb: 1 }}>
              <Link 
                component="button" 
                variant="body2" 
                onClick={() => navigate('/submissions')}
                sx={{ textDecoration: 'none' }}
              >
                Submissions
              </Link>
              <Typography variant="body2" color="text.primary">
                {submission.name}
              </Typography>
            </Breadcrumbs>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h4">
                {submission.name}
              </Typography>
              <Chip
                label={submission.status.replace('_', ' ').toUpperCase()}
                color={getStatusColor(submission.status)}
                icon={getStatusIcon(submission.status)}
              />
            </Box>
          </Box>

          <IconButton onClick={handleMenuOpen}>
            <MoreVertIcon />
          </IconButton>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Overview Cards */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, 
          gap: 2, 
          mb: 3 
        }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <SubmissionIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">Project</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {getProjectName(submission.project_id)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                  <BuildIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">Product</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {getProductName(submission.product_id)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <ScheduleIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">Target Date</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(submission.target_submission_date)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <ReportIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">Progress</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {submission.completion_percentage || 0}%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Progress Bar */}
        {submission.completion_percentage !== undefined && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h6">Overall Progress</Typography>
                <Typography variant="body2" color="text.secondary">
                  {submission.completion_percentage}% Complete
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={submission.completion_percentage}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="Overview" icon={<ViewIcon />} />
              <Tab label="Dossier" icon={<DossierIcon />} />
              <Tab label="Files" icon={<FileIcon />} />
              <Tab label="AI Assistant" icon={<AIIcon />} />
              <Tab label="Timeline" icon={<TimelineIcon />} />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            {/* Overview Tab */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Submission Details
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <List>
                    <ListItem>
                      <ListItemText 
                        primary="Submission Name" 
                        secondary={submission.name}
                      />
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemText 
                        primary="Submission Type" 
                        secondary={submission.submission_type || 'Not specified'}
                      />
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemText 
                        primary="Health Canada Reference" 
                        secondary={submission.health_canada_reference || 'Not assigned'}
                      />
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemText 
                        primary="Created Date" 
                        secondary={formatDate(submission.created_at)}
                      />
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemText 
                        primary="Last Updated" 
                        secondary={formatDate(submission.updated_at)}
                      />
                    </ListItem>
                  </List>
                </Paper>
              </Box>

              <Box>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Button
                      variant="contained"
                      startIcon={<DossierIcon />}
                      onClick={() => navigate(`/dossier/${submission.id}`)}
                    >
                      Open Dossier Builder
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<UploadIcon />}
                      onClick={() => setTabValue(2)}
                    >
                      Upload Files
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<ReportIcon />}
                      onClick={() => console.log('Generate report')}
                    >
                      Generate Report
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={() => console.log('Export submission')}
                    >
                      Export Submission
                    </Button>
                  </Box>
                </Paper>

                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                  Status History
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <CompleteIcon color="success" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Submission Created" 
                        secondary={formatDate(submission.created_at)}
                      />
                    </ListItem>
                    {/* Add more status history items here */}
                  </List>
                </Paper>
              </Box>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {/* Dossier Tab */}
            <DossierStructure submissionId={submission.id} />
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            {/* Files Tab */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Associated Files</Typography>
                <Button variant="contained" startIcon={<UploadIcon />}>
                  Upload Files
                </Button>
              </Box>
              
              {files.length === 0 ? (
                <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
                  <FileIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    No files uploaded yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Upload files related to this submission to get started.
                  </Typography>
                  <Button variant="contained" startIcon={<UploadIcon />}>
                    Upload Files
                  </Button>
                </Paper>
              ) : (
                <List>
                  {files.map((file) => (
                    <ListItem key={file.id} divider>
                      <ListItemIcon>
                        <FileIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={file.original_filename}
                        secondary={`${file.file_type} - ${Math.round(file.file_size / 1024)} KB - ${formatDate(file.created_at)}`}
                      />
                      <IconButton>
                        <DownloadIcon />
                      </IconButton>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            {/* AI Assistant Tab */}
            <AIDashboard submissionId={submission.id} />
          </TabPanel>

          <TabPanel value={tabValue} index={4}>
            {/* Timeline Tab */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Submission Timeline
              </Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <CompleteIcon color="success" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Submission Created" 
                      secondary={`${formatDate(submission.created_at)} - Submission was created and is ready for development`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <PendingIcon color="warning" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="In Progress" 
                      secondary="Currently building submission content and documentation"
                    />
                  </ListItem>
                </List>
              </Paper>
            </Box>
          </TabPanel>
        </Card>

        {/* Context Menu */}
        <Menu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={openEditDialog}>
            <EditIcon sx={{ mr: 1 }} />
            Edit Submission
          </MenuItem>
          <MenuItem onClick={() => navigate(`/dossier/${submission.id}`)}>
            <DossierIcon sx={{ mr: 1 }} />
            Open Dossier
          </MenuItem>
          <Divider />
          <MenuItem onClick={openDeleteDialog} sx={{ color: 'error.main' }}>
            <DeleteIcon sx={{ mr: 1 }} />
            Delete Submission
          </MenuItem>
        </Menu>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Submission</DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                label="Submission Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel>Submission Type</InputLabel>
                <Select
                  value={formData.submission_type}
                  onChange={(e) => setFormData({ ...formData, submission_type: e.target.value })}
                  label="Submission Type"
                >
                  <MenuItem value="medical_device_license">Medical Device License</MenuItem>
                  <MenuItem value="ivd_license">IVD License</MenuItem>
                  <MenuItem value="medical_device_amendment">Medical Device Amendment</MenuItem>
                  <MenuItem value="ivd_amendment">IVD Amendment</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth required>
                <InputLabel>Product</InputLabel>
                <Select
                  value={formData.product_id}
                  onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                  label="Product"
                >
                  {products.map((product) => (
                    <MenuItem key={product.id} value={product.id}>
                      {product.name} ({product.device_type})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <DatePicker
                label="Target Submission Date"
                value={formData.target_submission_date ? new Date(formData.target_submission_date) : null}
                onChange={(date) => setFormData({ 
                  ...formData, 
                  target_submission_date: date ? date.toISOString().split('T')[0] : '' 
                })}
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)} disabled={loading.isLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleEditSubmission}
              variant="contained"
              disabled={!formData.name.trim() || !formData.product_id || loading.isLoading}
            >
              {loading.isLoading ? 'Updating...' : 'Update Submission'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Delete Submission</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete "{submission.name}"? This action cannot be undone and will also delete all associated dossier content and files.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)} disabled={loading.isLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleDeleteSubmission}
              color="error"
              variant="contained"
              disabled={loading.isLoading}
            >
              {loading.isLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default SubmissionDetailsPage;