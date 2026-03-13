import { useState, useEffect, useCallback } from 'react';
import { Project, ProjectFormData, PaginatedResponse } from '../types';
import { apiService } from '../services/api';
import { useApp } from '../contexts/AppContext';

export const useProjects = () => {
  const { state, dispatch, setLoading } = useApp();
  const [pagination, setPagination] = useState({
    page: 1,
    size: 10,
    total: 0,
    pages: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');

  const loadProjects = useCallback(async (page = 1, size = 10, search?: string) => {
    try {
      setLoading('projects', true);
      const response: PaginatedResponse<Project> = await apiService.getProjects(page, size, search);
      
      dispatch({ type: 'SET_PROJECTS', payload: response.items });
      setPagination({
        page: response.page,
        size: response.size,
        total: response.total,
        pages: response.pages,
      });
      
      setLoading('projects', false);
      return response;
    } catch (error) {
      console.error('Error loading projects:', error);
      setLoading('projects', false, 'Failed to load projects');
      throw error;
    }
  }, [dispatch, setLoading]);

  const createProject = useCallback(async (projectData: ProjectFormData): Promise<Project> => {
    try {
      setLoading('projects', true);
      const newProject = await apiService.createProject(projectData);
      
      dispatch({ type: 'ADD_PROJECT', payload: newProject });
      setLoading('projects', false);
      
      // Reload projects to get updated list
      await loadProjects(pagination.page, pagination.size, searchQuery);
      
      return newProject;
    } catch (error) {
      console.error('Error creating project:', error);
      setLoading('projects', false, 'Failed to create project');
      throw error;
    }
  }, [dispatch, setLoading, loadProjects, pagination.page, pagination.size, searchQuery]);

  const updateProject = useCallback(async (id: string, projectData: Partial<ProjectFormData>): Promise<Project> => {
    try {
      setLoading('projects', true);
      const updatedProject = await apiService.updateProject(id, projectData);
      
      dispatch({ type: 'UPDATE_PROJECT', payload: updatedProject });
      setLoading('projects', false);
      
      return updatedProject;
    } catch (error) {
      console.error('Error updating project:', error);
      setLoading('projects', false, 'Failed to update project');
      throw error;
    }
  }, [dispatch, setLoading]);

  const deleteProject = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading('projects', true);
      await apiService.deleteProject(id);
      
      dispatch({ type: 'REMOVE_PROJECT', payload: id });
      setLoading('projects', false);
      
      // Reload projects to get updated list
      await loadProjects(pagination.page, pagination.size, searchQuery);
    } catch (error) {
      console.error('Error deleting project:', error);
      setLoading('projects', false, 'Failed to delete project');
      throw error;
    }
  }, [dispatch, setLoading, loadProjects, pagination.page, pagination.size, searchQuery]);

  const getProject = useCallback(async (id: string): Promise<Project> => {
    try {
      const project = await apiService.getProject(id);
      return project;
    } catch (error) {
      console.error('Error getting project:', error);
      throw error;
    }
  }, []);

  const searchProjects = useCallback(async (query: string) => {
    setSearchQuery(query);
    await loadProjects(1, pagination.size, query);
  }, [loadProjects, pagination.size]);

  const changePage = useCallback(async (newPage: number) => {
    await loadProjects(newPage, pagination.size, searchQuery);
  }, [loadProjects, pagination.size, searchQuery]);

  const changePageSize = useCallback(async (newSize: number) => {
    await loadProjects(1, newSize, searchQuery);
  }, [loadProjects, searchQuery]);

  // Load projects on mount
  useEffect(() => {
    if (state.projects.length === 0) {
      loadProjects();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run on mount

  return {
    projects: state.projects,
    loading: state.loadingStates.projects,
    pagination,
    searchQuery,
    currentProject: state.currentProject,
    
    // Actions
    loadProjects,
    createProject,
    updateProject,
    deleteProject,
    getProject,
    searchProjects,
    changePage,
    changePageSize,
    
    // Setters
    setCurrentProject: (project: Project | null) => dispatch({ type: 'SET_CURRENT_PROJECT', payload: project }),
  };
};

export default useProjects;