import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
} from '@mui/material';
import {
  Construction as ConstructionIcon,
} from '@mui/icons-material';

const FilesPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        File Manager
      </Typography>

      <Card>
        <CardContent sx={{ textAlign: 'center', py: 8 }}>
          <ConstructionIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            File Management System
          </Typography>
          <Typography variant="body1" color="text.secondary">
            This page will contain file upload, management, and AI processing features
            including drag-and-drop upload, batch processing, and content extraction.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default FilesPage;