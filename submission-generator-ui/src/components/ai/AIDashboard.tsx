import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Button,
  Alert,
  CircularProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Psychology as AIIcon,
  Assessment as StatsIcon,
  CheckCircle as CompleteIcon,
  Schedule as PendingIcon,
  Error as ErrorIcon,
  AutoAwesome as AutoIcon,
  Insights as InsightsIcon
} from '@mui/icons-material';
import { useAI } from '../../hooks/useAI';

interface AIDashboardProps {
  submissionId?: string;
}

const AIDashboard: React.FC<AIDashboardProps> = ({ submissionId }) => {
  const { analyzeSubmission, getStats, autoPopulate, processing, error } = useAI();
  const [submissionAnalysis, setSubmissionAnalysis] = useState<any>(null);
  const [globalStats, setGlobalStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    
    try {
      // Load global stats
      const stats = await getStats();
      setGlobalStats(stats);

      // Load submission-specific analysis if submissionId provided
      if (submissionId) {
        const analysis = await analyzeSubmission(submissionId);
        setSubmissionAnalysis(analysis);
      }
    } catch (err) {
      console.error('Failed to load AI dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [submissionId, getStats, analyzeSubmission]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAutoPopulate = async () => {
    if (!submissionId) return;
    
    const result = await autoPopulate(submissionId);
    if (result) {
      // Reload analysis after auto-population
      loadData();
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <AIIcon color="primary" />
        <Typography variant="h5">AI Processing Dashboard</Typography>
        {submissionId && (
          <Button
            variant="contained"
            startIcon={<AutoIcon />}
            onClick={handleAutoPopulate}
            disabled={processing}
          >
            Auto-Populate Submission
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Global AI Statistics */}
      {globalStats && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <StatsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Global AI Statistics
            </Typography>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 3 }}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {globalStats.ai_processing_stats.total_sections}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Sections
                </Typography>
              </Paper>
              
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {globalStats.ai_processing_stats.ai_processed_sections}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  AI Processed
                </Typography>
              </Paper>
              
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="info.main">
                  {globalStats.ai_processing_stats.ai_coverage_percentage}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  AI Coverage
                </Typography>
              </Paper>
              
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">
                  {(globalStats.ai_processing_stats.average_confidence_score * 100).toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Avg Confidence
                </Typography>
              </Paper>
            </Box>

            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                AI Coverage Progress
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={globalStats.ai_processing_stats.ai_coverage_percentage} 
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Submission-Specific Analysis */}
      {submissionAnalysis && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <InsightsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Submission Analysis
            </Typography>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 3, mb: 3 }}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {submissionAnalysis.analysis.completion_percentage.toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Completion
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={submissionAnalysis.analysis.completion_percentage} 
                  sx={{ mt: 1, height: 6, borderRadius: 3 }}
                />
              </Paper>
              
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {submissionAnalysis.analysis.ai_assisted_sections}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  AI Assisted
                </Typography>
              </Paper>
              
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="info.main">
                  {submissionAnalysis.analysis.manual_sections}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Manual
                </Typography>
              </Paper>
            </Box>

            {/* Section Breakdown */}
            <Box display="flex" gap={2} mb={3}>
              <Chip 
                icon={<CompleteIcon />} 
                label={`${submissionAnalysis.analysis.completed_sections} Completed`}
                color="success"
              />
              <Chip 
                icon={<PendingIcon />} 
                label={`${submissionAnalysis.analysis.total_sections - submissionAnalysis.analysis.completed_sections} Remaining`}
                color="warning"
              />
              <Chip 
                icon={<AIIcon />} 
                label={`${submissionAnalysis.analysis.ai_coverage}% AI Coverage`}
                color="info"
              />
            </Box>

            {/* Missing Sections */}
            {submissionAnalysis.analysis.missing_sections.length > 0 && (
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Missing Sections ({submissionAnalysis.analysis.missing_sections.length})
                </Typography>
                <List dense>
                  {submissionAnalysis.analysis.missing_sections.slice(0, 5).map((section: any) => (
                    <ListItem key={section.section_code}>
                      <ListItemIcon>
                        {section.has_ai_content ? (
                          <AIIcon color="info" fontSize="small" />
                        ) : (
                          <ErrorIcon color="error" fontSize="small" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={`${section.section_code} - ${section.section_title}`}
                        secondary={
                          <Box display="flex" gap={1} alignItems="center">
                            {section.is_required && (
                              <Chip label="Required" size="small" color="error" />
                            )}
                            {section.has_ai_content && (
                              <Chip label="AI Content Available" size="small" color="info" />
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                  {submissionAnalysis.analysis.missing_sections.length > 5 && (
                    <ListItem>
                      <ListItemText
                        primary={`... and ${submissionAnalysis.analysis.missing_sections.length - 5} more sections`}
                        sx={{ fontStyle: 'italic' }}
                      />
                    </ListItem>
                  )}
                </List>
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default AIDashboard;