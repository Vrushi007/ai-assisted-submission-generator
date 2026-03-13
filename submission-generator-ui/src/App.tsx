import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';

// Contexts
import { AppProvider } from './contexts/AppContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Layout components
import Layout from './components/layout/Layout';

// Page components
import Dashboard from './pages/dashboard/Dashboard';
import ProjectsPage from './pages/projects/ProjectsPage';
import ProjectDetailsPage from './pages/projects/ProjectDetailsPage';
import SubmissionsPage from './pages/submissions/SubmissionsPage';
import SubmissionDetailsPage from './pages/submissions/SubmissionDetailsPage';
import DossierPage from './pages/dossier/DossierPage';
import FilesPage from './pages/files/FilesPage';
import AIPage from './pages/ai/AIPage';

// Error boundary
import ErrorBoundary from './components/common/ErrorBoundary';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppProvider>
          <Router>
            <Box sx={{ display: 'flex', minHeight: '100vh' }}>
              <Layout>
                <Routes>
                  {/* Dashboard */}
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  
                  {/* Projects */}
                  <Route path="/projects" element={<ProjectsPage />} />
                  <Route path="/projects/:projectId" element={<ProjectDetailsPage />} />
                  
                  {/* Submissions */}
                  <Route path="/submissions" element={<SubmissionsPage />} />
                  <Route path="/submissions/:submissionId" element={<SubmissionDetailsPage />} />
                  
                  {/* Dossier */}
                  <Route path="/dossier/:submissionId" element={<DossierPage />} />
                  
                  {/* Files */}
                  <Route path="/files" element={<FilesPage />} />
                  <Route path="/files/:projectId" element={<FilesPage />} />
                  
                  {/* AI */}
                  <Route path="/ai" element={<AIPage />} />
                  
                  {/* Catch all */}
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Layout>
            </Box>
          </Router>
        </AppProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;