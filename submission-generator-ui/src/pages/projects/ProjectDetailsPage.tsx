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
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Assignment as SubmissionIcon,
  Inventory as ProductIcon,
  CloudUpload as FileIcon,
  TrendingUp as StatsIcon,
  Business as ClientIcon,
  Email as EmailIcon,
  CalendarToday as DateIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';

import { Project, ProjectStatus } from '../../types';
import { useProjects, useProducts, useSubmissions, useFiles } from '../../hooks';
import { LoadingSpinner } from '../../components/common';
import { ProductManagement } from '../../components/products';
import { SubmissionManagement } from '../../components/submissions';
import { FileManagement } from '../../components/files';

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
      id={`project-tabpanel-${index}`}
      aria-labelledby={`project-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const ProjectDetailsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  // Force recompilation to clear cached errors
  const { getProject, loading: projectLoading } = useProjects();
  const { products, loadProducts } = useProducts(projectId);
  const { submissions, loadSubmissions } = useSubmissions(projectId);
  const { files, loadFiles } = useFiles();

  const [project, setProject] = useState<Project | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Load project details
  useEffect(() => {
    const loadProjectDetails = async () => {
      if (!projectId) {
        setError('Project ID is required');
        return;
      }

      try {
        const projectData = await getProject(projectId);
        setProject(projectData);
        
        // Load related data
        await Promise.all([
          loadProducts(projectId),
          loadSubmissions(1, 10, projectId),
          loadFiles(projectId),
        ]);
      } catch (error) {
        console.error('Error loading project details:', error);
        setError('Failed to load project details');
      }
    };

    loadProjectDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.ACTIVE:
        return 'success';
      case ProjectStatus.COMPLETED:
        return 'info';
      case ProjectStatus.ON_HOLD:
        return 'warning';
      case ProjectStatus.CANCELLED:
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (projectLoading.isLoading && !project) {
    return <LoadingSpinner message="Loading project details..." fullScreen />;
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button onClick={() => navigate('/projects')} startIcon={<BackIcon />}>
          Back to Projects
        </Button>
      </Box>
    );
  }

  if (!project) {
    return (
      <Box>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Project not found
        </Alert>
        <Button onClick={() => navigate('/projects')} startIcon={<BackIcon />}>
          Back to Projects
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link 
          color="inherit" 
          href="/projects" 
          onClick={(e) => { e.preventDefault(); navigate('/projects'); }}
        >
          Projects
        </Link>
        <Typography color="text.primary">{project.name}</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            {project.name}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Chip
              label={project.status}
              color={getStatusColor(project.status) as any}
              size="small"
            />
            <Typography variant="body2" color="text.secondary">
              Created {formatDate(project.created_at)}
            </Typography>
          </Box>
          {project.description && (
            <Typography variant="body1" color="text.secondary" paragraph>
              {project.description}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton color="primary" title="Edit Project">
            <EditIcon />
          </IconButton>
          <IconButton color="error" title="Delete Project">
            <DeleteIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { 
          xs: '1fr', 
          sm: '1fr 1fr', 
          md: '1fr 1fr 1fr 1fr' 
        }, 
        gap: 3, 
        mb: 4 
      }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <ProductIcon />
              </Avatar>
              <Box>
                <Typography variant="h5">{products.length}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Products
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'secondary.main' }}>
                <SubmissionIcon />
              </Avatar>
              <Box>
                <Typography variant="h5">{submissions.length}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Submissions
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'info.main' }}>
                <FileIcon />
              </Avatar>
              <Box>
                <Typography variant="h5">{files.length}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Files
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'success.main' }}>
                <StatsIcon />
              </Avatar>
              <Box>
                <Typography variant="h5">85%</Typography>
                <Typography variant="body2" color="text.secondary">
                  Completion
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Client Information */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Client Information
          </Typography>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
            gap: 3 
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <ClientIcon color="action" />
              <Box>
                <Typography variant="subtitle2">Client Name</Typography>
                <Typography variant="body1">{project.client_name}</Typography>
              </Box>
            </Box>
            {project.client_contact_email && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <EmailIcon color="action" />
                <Box>
                  <Typography variant="subtitle2">Contact Email</Typography>
                  <Typography variant="body1">{project.client_contact_email}</Typography>
                </Box>
              </Box>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <DateIcon color="action" />
              <Box>
                <Typography variant="subtitle2">Created Date</Typography>
                <Typography variant="body1">{formatDate(project.created_at)}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <DateIcon color="action" />
              <Box>
                <Typography variant="subtitle2">Last Updated</Typography>
                <Typography variant="body1">{formatDate(project.updated_at)}</Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Tabs for detailed views */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="project details tabs">
            <Tab label="Overview" />
            <Tab label={`Products (${products.length})`} />
            <Tab label={`Submissions (${submissions.length})`} />
            <Tab label={`Files (${files.length})`} />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {/* Overview Tab */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
            gap: 3 
          }}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, minHeight: 200 }}>
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 8 }}>
                  Activity timeline will be implemented here
                </Typography>
              </Paper>
            </Box>
            <Box>
              <Typography variant="h6" gutterBottom>
                Project Progress
              </Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Overall Completion: 85%
                  </Typography>
                  <LinearProgress variant="determinate" value={85} sx={{ mb: 2 }} />
                </Box>
                <Divider sx={{ my: 2 }} />
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="Products Setup" 
                      secondary={`${products.length} products configured`}
                    />
                    <Chip label="Complete" color="success" size="small" />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Submissions" 
                      secondary={`${submissions.length} submissions in progress`}
                    />
                    <Chip label="In Progress" color="warning" size="small" />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Documentation" 
                      secondary={`${files.length} files uploaded`}
                    />
                    <Chip label="In Progress" color="warning" size="small" />
                  </ListItem>
                </List>
              </Paper>
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* Products Tab */}
          <ProductManagement
            projectId={projectId!}
            products={products}
            onProductsChange={() => loadProducts(projectId)}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {/* Submissions Tab */}
          <SubmissionManagement
            projectId={projectId!}
            submissions={submissions}
            products={products}
            onSubmissionsChange={() => loadSubmissions()}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          {/* Files Tab */}
          <FileManagement
            projectId={projectId!}
            files={files}
            submissions={submissions}
            onFilesChange={() => loadFiles(projectId)}
          />
        </TabPanel>
      </Card>
    </Box>
  );
};

export default ProjectDetailsPage;