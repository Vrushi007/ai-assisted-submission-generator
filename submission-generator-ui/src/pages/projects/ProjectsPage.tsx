import React, { useState } from "react";
import {
  Box,
  Typography,
  Card,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  LinearProgress,
  Alert,
  Tooltip,
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  FolderOpen as FolderIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

import { Project, ProjectStatus, ProjectFormData } from "../../types";
import useProjects from "../../hooks/useProjects";

const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    projects,
    loading,
    searchQuery,
    loadProjects,
    createProject,
    updateProject,
    deleteProject,
    searchProjects,
    setCurrentProject,
  } = useProjects();

  // Local state
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ProjectFormData>({
    name: "",
    description: "",
    client_name: "",
    client_contact_email: "",
    status: ProjectStatus.ACTIVE,
  });

  // Event handlers
  const handleSearch = () => {
    searchProjects(searchInput);
  };

  const handleSearchKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  const handleMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    project: Project,
  ) => {
    setSelectedProject(project);
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleCreateProject = async () => {
    try {
      const newProject = await createProject(formData);
      setCreateDialogOpen(false);
      setFormData({
        name: "",
        description: "",
        client_name: "",
        client_contact_email: "",
        status: ProjectStatus.ACTIVE,
      });

      // Navigate to the new project
      setCurrentProject(newProject);
      navigate(`/projects/${newProject.id}`);
    } catch (error) {
      console.error("Failed to create project:", error);
    }
  };

  const handleEditProject = async () => {
    if (!selectedProject) return;

    try {
      await updateProject(selectedProject.id, formData);
      setEditDialogOpen(false);
      setFormData({
        name: "",
        description: "",
        client_name: "",
        client_contact_email: "",
        status: ProjectStatus.ACTIVE,
      });
      handleMenuClose();
    } catch (error) {
      console.error("Failed to update project:", error);
    }
  };

  const handleDeleteProject = async () => {
    if (!selectedProject) return;

    try {
      await deleteProject(selectedProject.id);
      setDeleteDialogOpen(false);
      handleMenuClose();
    } catch (error) {
      console.error("Failed to delete project:", error);
    }
  };

  const openCreateDialog = () => {
    setFormData({
      name: "",
      description: "",
      client_name: "",
      client_contact_email: "",
      status: ProjectStatus.ACTIVE,
    });
    setCreateDialogOpen(true);
  };

  const openEditDialog = () => {
    if (selectedProject) {
      setFormData({
        name: selectedProject.name,
        description: selectedProject.description || "",
        client_name: selectedProject.client_name || "",
        client_contact_email: selectedProject.client_contact_email || "",
        status: selectedProject.status,
      });
      setEditDialogOpen(true);
      handleMenuClose();
    }
  };

  const openDeleteDialog = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.ACTIVE:
        return "success";
      case ProjectStatus.COMPLETED:
        return "info";
      case ProjectStatus.ON_HOLD:
        return "warning";
      case ProjectStatus.CANCELLED:
        return "error";
      default:
        return "default";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading.isLoading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Projects
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  if (loading.error) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Projects
        </Typography>
        <Alert
          severity="error"
          action={
            <IconButton onClick={() => loadProjects()}>
              <RefreshIcon />
            </IconButton>
          }
        >
          {loading.error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" gutterBottom>
          Projects
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreateDialog}
        >
          New Project
        </Button>
      </Box>

      {/* Search */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search projects..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyPress={handleSearchKeyPress}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <Button onClick={handleSearch}>Search</Button>
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Projects Table */}
      <Card>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Products</TableCell>
                <TableCell>Submissions</TableCell>
                <TableCell>Files</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <FolderIcon
                      sx={{ fontSize: 48, color: "text.secondary", mb: 2 }}
                    />
                    <Typography variant="h6" color="text.secondary">
                      No projects found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Create your first project to get started
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                projects.map((project) => (
                  <TableRow key={project.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2">
                          {project.name}
                        </Typography>
                        {project.description && (
                          <Typography variant="body2" color="text.secondary">
                            {project.description}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={project.status}
                        color={getStatusColor(project.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{project.products_count || 0}</TableCell>
                    <TableCell>{project.submissions_count || 0}</TableCell>
                    <TableCell>{project.files_count || 0}</TableCell>
                    <TableCell>{formatDate(project.created_at)}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Project">
                        <IconButton
                          onClick={() => {
                            setCurrentProject(project);
                            navigate(`/projects/${project.id}`);
                          }}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <IconButton onClick={(e) => handleMenuClick(e, project)}>
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={openEditDialog}>
          <EditIcon sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={openDeleteDialog} sx={{ color: "error.main" }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Create Project Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Project</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Project Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              fullWidth
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              multiline
              rows={3}
              fullWidth
            />
            <TextField
              label="Client Name"
              value={formData.client_name}
              onChange={(e) =>
                setFormData({ ...formData, client_name: e.target.value })
              }
              required
              fullWidth
            />
            <TextField
              label="Client Contact Email"
              type="email"
              value={formData.client_contact_email}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  client_contact_email: e.target.value,
                })
              }
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as ProjectStatus,
                  })
                }
                label="Status"
              >
                {Object.values(ProjectStatus).map((status) => (
                  <MenuItem key={status} value={status}>
                    {status.replace("_", " ").toUpperCase()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateProject}
            variant="contained"
            disabled={!formData.name.trim() || !formData.client_name.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Project</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Project Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              fullWidth
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              multiline
              rows={3}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as ProjectStatus,
                  })
                }
                label="Status"
              >
                {Object.values(ProjectStatus).map((status) => (
                  <MenuItem key={status} value={status}>
                    {status.replace("_", " ").toUpperCase()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleEditProject}
            variant="contained"
            disabled={!formData.name.trim()}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Project</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedProject?.name}"? This
            action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteProject}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectsPage;
