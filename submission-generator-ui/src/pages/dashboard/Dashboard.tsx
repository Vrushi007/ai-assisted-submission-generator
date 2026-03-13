import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Alert,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  FolderOpen as ProjectsIcon,
  Assignment as SubmissionsIcon,
  CloudUpload as FilesIcon,
  Psychology as AIIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon,
  Wifi as HealthyIcon,
  WifiOff as UnhealthyIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { useApp } from '../../contexts/AppContext';
import useDashboard from '../../hooks/useDashboard';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useApp();
  const {
    stats,
    recentActivity,
    isHealthy,
    refreshDashboard,
    getActivityIcon,
    getActivityColor,
    formatTimeAgo,
  } = useDashboard();

  // Helper function to render activity icons
  const renderActivityIcon = (type: string) => {
    const iconName = getActivityIcon(type as any);
    switch (iconName) {
      case 'FolderOpen':
        return <ProjectsIcon fontSize="small" />;
      case 'Assignment':
        return <SubmissionsIcon fontSize="small" />;
      case 'CloudUpload':
        return <FilesIcon fontSize="small" />;
      case 'Psychology':
        return <AIIcon fontSize="small" />;
      default:
        return <TrendingUpIcon fontSize="small" />;
    }
  };

  if (state.loadingStates.projects.isLoading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  if (state.loadingStates.projects.error) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Alert 
          severity="error" 
          action={
            <IconButton onClick={refreshDashboard}>
              <RefreshIcon />
            </IconButton>
          }
        >
          {state.loadingStates.projects.error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h4" gutterBottom>
            Dashboard
          </Typography>
          <Chip
            icon={isHealthy ? <HealthyIcon /> : <UnhealthyIcon />}
            label={isHealthy ? 'API Connected' : 'API Disconnected'}
            color={isHealthy ? 'success' : 'error'}
            size="small"
            variant="outlined"
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={refreshDashboard} title="Refresh Dashboard">
            <RefreshIcon />
          </IconButton>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/projects')}
          >
            New Project
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
        gap: 3,
        mb: 4 
      }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <ProjectsIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Projects</Typography>
            </Box>
            <Typography variant="h3" color="primary">
              {stats?.total_projects || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {stats?.active_projects || 0} active
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <SubmissionsIcon color="secondary" sx={{ mr: 1 }} />
              <Typography variant="h6">Submissions</Typography>
            </Box>
            <Typography variant="h3" color="secondary">
              {stats?.total_submissions || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {stats?.pending_reviews || 0} pending review
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <FilesIcon color="info" sx={{ mr: 1 }} />
              <Typography variant="h6">Files</Typography>
            </Box>
            <Typography variant="h3" color="info.main">
              {stats?.files_processed || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              processed
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <AIIcon color="success" sx={{ mr: 1 }} />
              <Typography variant="h6">AI Extractions</Typography>
            </Box>
            <Typography variant="h3" color="success.main">
              {stats?.ai_extractions_today || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              today
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Recent Activity */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' },
        gap: 3 
      }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            {recentActivity.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No recent activity
              </Typography>
            ) : (
              <Box>
                {recentActivity.map((activity) => (
                  <Box
                    key={activity.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      py: 2,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      '&:last-child': {
                        borderBottom: 'none',
                      },
                    }}
                  >
                      <Chip
                        icon={renderActivityIcon(activity.type)}
                        label=""
                        size="small"
                        color={getActivityColor(activity.type as any) as any}
                        sx={{ mr: 2, minWidth: 'auto', '& .MuiChip-label': { display: 'none' } }}
                      />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        {activity.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {activity.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {activity.user} • {formatTimeAgo(activity.timestamp)}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => navigate('/projects')}
                fullWidth
              >
                Create New Project
              </Button>
              <Button
                variant="outlined"
                startIcon={<FilesIcon />}
                onClick={() => navigate('/files')}
                fullWidth
              >
                Upload Documents
              </Button>
              <Button
                variant="outlined"
                startIcon={<AIIcon />}
                onClick={() => navigate('/ai')}
                fullWidth
              >
                AI Assistant
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default Dashboard;