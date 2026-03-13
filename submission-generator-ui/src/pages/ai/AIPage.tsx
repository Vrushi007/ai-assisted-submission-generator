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

const AIPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        AI Assistant
      </Typography>

      <Card>
        <CardContent sx={{ textAlign: 'center', py: 8 }}>
          <ConstructionIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            AI-Powered Content Processing
          </Typography>
          <Typography variant="body1" color="text.secondary">
            This page will contain AI extraction results, content suggestions,
            quality assessments, and model management features.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AIPage;