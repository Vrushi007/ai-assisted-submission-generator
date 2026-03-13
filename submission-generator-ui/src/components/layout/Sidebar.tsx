import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
  Chip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  FolderOpen as ProjectsIcon,
  Assignment as SubmissionsIcon,
  Description as DossierIcon,
  CloudUpload as FilesIcon,
  Psychology as AIIcon,
  RateReview as ReviewsIcon,
  Assessment as ReportsIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

import { NavItem } from '../../types';
import { useApp } from '../../contexts/AppContext';

interface SidebarProps {
  onItemClick?: () => void;
}

const navigationItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: DashboardIcon,
  },
  {
    id: 'projects',
    label: 'Projects',
    path: '/projects',
    icon: ProjectsIcon,
  },
  {
    id: 'submissions',
    label: 'Submissions',
    path: '/submissions',
    icon: SubmissionsIcon,
  },
  {
    id: 'dossier',
    label: 'Dossier Builder',
    path: '/dossier',
    icon: DossierIcon,
  },
  {
    id: 'files',
    label: 'File Manager',
    path: '/files',
    icon: FilesIcon,
  },
  {
    id: 'ai',
    label: 'AI Assistant',
    path: '/ai',
    icon: AIIcon,
  },
];

const secondaryItems: NavItem[] = [
  {
    id: 'reviews',
    label: 'Reviews',
    path: '/reviews',
    icon: ReviewsIcon,
  },
  {
    id: 'reports',
    label: 'Reports',
    path: '/reports',
    icon: ReportsIcon,
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    icon: SettingsIcon,
  },
];

const Sidebar: React.FC<SidebarProps> = ({ onItemClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useApp();

  const handleNavigation = (path: string) => {
    navigate(path);
    if (onItemClick) {
      onItemClick();
    }
  };

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const active = isActive(item.path);

    return (
      <ListItem key={item.id} disablePadding>
        <ListItemButton
          onClick={() => handleNavigation(item.path)}
          selected={active}
          sx={{
            borderRadius: 1,
            mx: 1,
            mb: 0.5,
            '&.Mui-selected': {
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
              '& .MuiListItemIcon-root': {
                color: 'primary.contrastText',
              },
            },
          }}
        >
          {Icon && (
            <ListItemIcon>
              <Icon />
            </ListItemIcon>
          )}
          <ListItemText 
            primary={item.label}
            primaryTypographyProps={{
              fontWeight: active ? 600 : 400,
            }}
          />
        </ListItemButton>
      </ListItem>
    );
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AIIcon color="primary" />
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600 }}>
            RegSub AI
          </Typography>
        </Box>
      </Toolbar>
      
      <Divider />

      {/* Current Context */}
      {(state.currentProject || state.currentSubmission) && (
        <Box sx={{ p: 2 }}>
          {state.currentProject && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Current Project
              </Typography>
              <Chip
                label={state.currentProject.name}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ mt: 0.5, maxWidth: '100%' }}
              />
            </Box>
          )}
          {state.currentSubmission && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Current Submission
              </Typography>
              <Chip
                label={state.currentSubmission.name}
                size="small"
                color="secondary"
                variant="outlined"
                sx={{ mt: 0.5, maxWidth: '100%' }}
              />
            </Box>
          )}
        </Box>
      )}

      {(state.currentProject || state.currentSubmission) && <Divider />}

      {/* Main Navigation */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <List sx={{ pt: 1 }}>
          {navigationItems.map(renderNavItem)}
        </List>

        <Divider sx={{ mx: 2, my: 2 }} />

        {/* Secondary Navigation */}
        <List>
          {secondaryItems.map(renderNavItem)}
        </List>
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary" align="center" display="block">
          Health Canada IMDRF
        </Typography>
        <Typography variant="caption" color="text.secondary" align="center" display="block">
          Submission Builder v1.0
        </Typography>
      </Box>
    </Box>
  );
};

export default Sidebar;