import React from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
} from '@mui/material';
import {
  Construction as ConstructionIcon,
} from '@mui/icons-material';

const DossierPage: React.FC = () => {
  const { submissionId } = useParams<{ submissionId: string }>();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dossier Builder
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Submission ID: {submissionId}
      </Typography>

      <Card>
        <CardContent sx={{ textAlign: 'center', py: 8 }}>
          <ConstructionIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            IMDRF Dossier Builder
          </Typography>
          <Typography variant="body1" color="text.secondary">
            This page will contain the interactive dossier builder with IMDRF templates,
            section management, and content organization features.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DossierPage;