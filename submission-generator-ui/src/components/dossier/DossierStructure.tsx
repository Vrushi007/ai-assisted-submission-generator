import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Button,
  IconButton,
  Collapse,
  Alert,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as NotStartedIcon,
  PlayCircle as InProgressIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Assignment as AssignmentIcon,
  Psychology as AIIcon,
  AutoAwesome as GenerateIcon
} from '@mui/icons-material';
import { useDossier, DossierSection, DossierSectionDetail } from '../../hooks/useDossier';
import { useAI } from '../../hooks/useAI';

interface DossierStructureProps {
  submissionId: string;
}

interface SectionItemProps {
  section: DossierSection;
  level: number;
  onSectionClick: (sectionId: string) => void;
}

const SectionItem: React.FC<SectionItemProps> = ({ section, level, onSectionClick }) => {
  const [expanded, setExpanded] = useState(level < 2); // Auto-expand first 2 levels

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon color="success" />;
      case 'in_progress':
        return <InProgressIcon color="primary" />;
      case 'under_review':
        return <AssignmentIcon color="warning" />;
      default:
        return <NotStartedIcon color="disabled" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'primary';
      case 'under_review':
        return 'warning';
      default:
        return 'default';
    }
  };

  const hasChildren = section.children && section.children.length > 0;

  return (
    <Box sx={{ ml: level * 2 }}>
      <Card 
        variant="outlined" 
        sx={{ 
          mb: 1, 
          cursor: 'pointer',
          '&:hover': { bgcolor: 'action.hover' },
          borderLeft: section.is_required ? '4px solid #f44336' : '4px solid transparent'
        }}
        onClick={() => onSectionClick(section.id)}
      >
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              {hasChildren && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpanded(!expanded);
                  }}
                  sx={{ mr: 1 }}
                >
                  {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              )}
              
              {!hasChildren && (
                <Box sx={{ width: 40, display: 'flex', justifyContent: 'center', mr: 1 }}>
                  {getStatusIcon(section.status)}
                </Box>
              )}

              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {section.section_code} - {section.section_title}
                  </Typography>
                  {section.is_required && (
                    <Chip label="Required" size="small" color="error" variant="outlined" />
                  )}
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {section.section_description}
                </Typography>

                {!hasChildren && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip 
                      label={section.status.replace('_', ' ').toUpperCase()} 
                      size="small" 
                      color={getStatusColor(section.status) as any}
                      variant="filled"
                    />
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption">
                        {Math.round(section.completion_percentage)}% complete
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={section.completion_percentage} 
                        sx={{ width: 60, height: 4 }}
                      />
                    </Box>

                    {section.has_content && (
                      <Tooltip title="Has content">
                        <DescriptionIcon color="primary" fontSize="small" />
                      </Tooltip>
                    )}
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {hasChildren && (
        <Collapse in={expanded}>
          <Box sx={{ ml: 1 }}>
            {section.children.map((child) => (
              <SectionItem
                key={child.id}
                section={child}
                level={level + 1}
                onSectionClick={onSectionClick}
              />
            ))}
          </Box>
        </Collapse>
      )}
    </Box>
  );
};

const SectionDetailDialog: React.FC<{
  open: boolean;
  section: DossierSectionDetail | null;
  submissionId: string;
  onClose: () => void;
  onUpdate: () => void;
}> = ({ open, section, submissionId, onClose, onUpdate }) => {
  const { updateSectionContent, markSectionComplete, loading } = useDossier();
  const { generateContent, processing: aiProcessing } = useAI();
  const [content, setContent] = useState('');
  const [editMode, setEditMode] = useState(false);

  React.useEffect(() => {
    if (section) {
      // Priority: user content > AI extracted content > placeholder content
      const initialContent = section.content || 
                            section.ai_extracted_content || 
                            section.placeholder_content || '';
      setContent(initialContent);
      setEditMode(!section.content); // Only auto-edit if no user content exists
    }
  }, [section]);

  const handleSave = async () => {
    if (!section) return;
    
    const success = await updateSectionContent(submissionId, section.id, content, 'Current User');
    if (success) {
      setEditMode(false);
      onUpdate();
    }
  };

  const handleMarkComplete = async () => {
    if (!section) return;
    
    const success = await markSectionComplete(submissionId, section.id, 'Current User');
    if (success) {
      onUpdate();
    }
  };

  const handleGenerateContent = async () => {
    if (!section) return;
    
    try {
      const result = await generateContent(section.id);
      if (result && result.generated_content) {
        setContent(result.generated_content);
        setEditMode(true); // Enable editing so user can review/modify
      }
    } catch (error) {
      console.error('Failed to generate content:', error);
    }
  };

  if (!section) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            {section.section_code} - {section.section_title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip 
              label={section.status.replace('_', ' ').toUpperCase()} 
              size="small" 
              color={section.status === 'completed' ? 'success' : 'default'}
            />
            {section.is_required && (
              <Chip label="Required" size="small" color="error" variant="outlined" />
            )}
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {section.section_description}
          </Typography>
        </Box>

        {section.content_requirements.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Content Requirements:
            </Typography>
            <ul>
              {section.content_requirements.map((req) => (
                <li key={req}>
                  <Typography variant="body2">{req}</Typography>
                </li>
              ))}
            </ul>
          </Box>
        )}

        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2">
                Content:
              </Typography>
              {section.ai_extracted_content && !section.content && (
                <Chip 
                  label="AI Generated" 
                  size="small" 
                  color="info" 
                  icon={<AIIcon />}
                />
              )}
              {section.ai_confidence_score && section.ai_confidence_score > 0 && (
                <Chip 
                  label={`${Math.round(section.ai_confidence_score * 100)}% confidence`}
                  size="small" 
                  variant="outlined"
                />
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                startIcon={<GenerateIcon />}
                onClick={handleGenerateContent}
                size="small"
                variant="outlined"
                disabled={aiProcessing}
              >
                Generate with AI
              </Button>
              <Button
                startIcon={<EditIcon />}
                onClick={() => setEditMode(!editMode)}
                size="small"
              >
                {editMode ? 'Cancel Edit' : 'Edit Content'}
              </Button>
            </Box>
          </Box>
          
          <TextField
            multiline
            rows={12}
            fullWidth
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={!editMode}
            placeholder={section.placeholder_content}
            variant="outlined"
            sx={{ 
              '& .MuiInputBase-input': { 
                fontFamily: 'monospace',
                fontSize: '0.875rem'
              }
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption">
            Completion: {Math.round(section.completion_percentage)}%
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={section.completion_percentage} 
            sx={{ flex: 1, height: 6 }}
          />
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
        
        {editMode && (
          <Button 
            onClick={handleSave} 
            variant="contained"
            disabled={loading}
          >
            Save Content
          </Button>
        )}
        
        {section.status !== 'completed' && (
          <Button 
            onClick={handleMarkComplete} 
            variant="contained"
            color="success"
            disabled={loading}
          >
            Mark Complete
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

const DossierStructure: React.FC<DossierStructureProps> = ({ submissionId }) => {
  const { 
    dossier, 
    selectedSection, 
    loading, 
    error, 
    loadSection, 
    regenerateDossier,
    getDossierStats,
    setSelectedSection
  } = useDossier(submissionId);
  
  const { getActiveTasksForSubmission } = useAI();
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [aiTasks, setAiTasks] = useState<any>(null);

  const handleSectionClick = async (sectionId: string) => {
    await loadSection(submissionId, sectionId);
    setDetailDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDetailDialogOpen(false);
    setSelectedSection(null);
  };

  const handleRegenerateDossier = async () => {
    const success = await regenerateDossier(submissionId);
    if (success) {
      // Dossier will be automatically reloaded by the hook
    }
  };

  // Check for active AI tasks periodically
  React.useEffect(() => {
    const checkAITasks = async () => {
      const tasks = await getActiveTasksForSubmission(submissionId);
      setAiTasks(tasks);
    };

    checkAITasks();
    
    // Poll every 5 seconds if there are active tasks
    const interval = setInterval(() => {
      if (aiTasks?.has_active_processing) {
        checkAITasks();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [submissionId, getActiveTasksForSubmission, aiTasks?.has_active_processing]);

  const stats = getDossierStats();

  if (loading && !dossier) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Loading dossier structure...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!dossier) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          No Dossier Structure Found
        </Typography>
        <Typography color="text.secondary" gutterBottom>
          Generate a dossier structure for this submission based on IMDRF templates.
        </Typography>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={handleRegenerateDossier}
          disabled={loading}
        >
          Generate Dossier
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Submission Dossier Structure
        </Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={handleRegenerateDossier}
          disabled={loading}
          size="small"
        >
          Regenerate
        </Button>
      </Box>

      {/* AI Processing Status */}
      {aiTasks?.has_active_processing && (
        <Alert 
          severity="info" 
          sx={{ mb: 3 }}
          icon={<AIIcon />}
        >
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              🤖 AI Processing in Progress
            </Typography>
            <Typography variant="body2">
              AI is analyzing your documents and updating dossier sections in the background. 
              Sections will show "AI Generated" badges as they're completed.
            </Typography>
            {aiTasks.active_tasks.map((task: any) => (
              <Box key={task.task_id} sx={{ mt: 1 }}>
                <Typography variant="caption" display="block">
                  {task.current_message || `Progress: ${task.progress}%`}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={task.progress} 
                  sx={{ height: 4, borderRadius: 2 }}
                />
              </Box>
            ))}
          </Box>
        </Alert>
      )}

      {/* Stats */}
      {stats && (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="primary">
              {stats.totalSections}
            </Typography>
            <Typography variant="body2">Total Sections</Typography>
          </Paper>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="success.main">
              {stats.completedSections}
            </Typography>
            <Typography variant="body2">Completed</Typography>
          </Paper>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="warning.main">
              {stats.inProgressSections}
            </Typography>
            <Typography variant="body2">In Progress</Typography>
          </Paper>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4">
              {stats.overallCompletion}%
            </Typography>
            <Typography variant="body2">Overall Progress</Typography>
          </Paper>
        </Box>
      )}

      {/* Template Info */}
      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="body2">
          <strong>Template:</strong> {dossier.template_info.template_name} v{dossier.template_info.version}
          {' • '}
          <strong>Type:</strong> {dossier.submission_type}
          {' • '}
          <strong>Total Sections:</strong> {dossier.total_sections}
        </Typography>
      </Alert>

      {/* Dossier Sections */}
      <Box>
        {dossier.dossier_sections.map((section) => (
          <SectionItem
            key={section.id}
            section={section}
            level={0}
            onSectionClick={handleSectionClick}
          />
        ))}
      </Box>

      {/* Section Detail Dialog */}
      <SectionDetailDialog
        open={detailDialogOpen}
        section={selectedSection}
        submissionId={submissionId}
        onClose={handleCloseDialog}
        onUpdate={() => {
          // Refresh the dossier data
          // The hook will automatically reload
        }}
      />
    </Box>
  );
};

export default DossierStructure;