import { useState, useEffect, useCallback } from 'react';
import { Submission, SubmissionFormData, PaginatedResponse } from '../types';
import { apiService } from '../services/api';
import { useApp } from '../contexts/AppContext';

export const useSubmissions = (projectId?: string) => {
  const { state, dispatch, setLoading } = useApp();
  const [pagination, setPagination] = useState({
    page: 1,
    size: 10,
    total: 0,
    pages: 0,
  });

  const loadSubmissions = useCallback(async (page = 1, size = 10, filterProjectId?: string) => {
    try {
      setLoading('submissions', true);
      const response: PaginatedResponse<Submission> = await apiService.getSubmissions(
        filterProjectId || projectId, 
        page, 
        size
      );
      
      dispatch({ type: 'SET_SUBMISSIONS', payload: response.items });
      setPagination({
        page: response.page,
        size: response.size,
        total: response.total,
        pages: response.pages,
      });
      
      setLoading('submissions', false);
      return response;
    } catch (error) {
      console.error('Error loading submissions:', error);
      setLoading('submissions', false, 'Failed to load submissions');
      throw error;
    }
  }, [dispatch, setLoading, projectId]);

  const createSubmission = useCallback(async (
    submissionProjectId: string, 
    submissionData: SubmissionFormData
  ): Promise<Submission> => {
    try {
      setLoading('submissions', true);
      const newSubmission = await apiService.createSubmission(submissionProjectId, submissionData);
      
      dispatch({ type: 'ADD_SUBMISSION', payload: newSubmission });
      setLoading('submissions', false);
      
      // Reload submissions to get updated list
      await loadSubmissions(pagination.page, pagination.size, submissionProjectId);
      
      return newSubmission;
    } catch (error) {
      console.error('Error creating submission:', error);
      setLoading('submissions', false, 'Failed to create submission');
      throw error;
    }
  }, [dispatch, setLoading, loadSubmissions, pagination.page, pagination.size]);

  const updateSubmission = useCallback(async (
    id: string, 
    submissionData: Partial<SubmissionFormData>
  ): Promise<Submission> => {
    try {
      setLoading('submissions', true);
      const updatedSubmission = await apiService.updateSubmission(id, submissionData);
      
      dispatch({ type: 'UPDATE_SUBMISSION', payload: updatedSubmission });
      setLoading('submissions', false);
      
      return updatedSubmission;
    } catch (error) {
      console.error('Error updating submission:', error);
      setLoading('submissions', false, 'Failed to update submission');
      throw error;
    }
  }, [dispatch, setLoading]);

  const deleteSubmission = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading('submissions', true);
      await apiService.deleteSubmission(id);
      
      dispatch({ type: 'REMOVE_SUBMISSION', payload: id });
      setLoading('submissions', false);
      
      // Reload submissions to get updated list
      await loadSubmissions(pagination.page, pagination.size, projectId);
    } catch (error) {
      console.error('Error deleting submission:', error);
      setLoading('submissions', false, 'Failed to delete submission');
      throw error;
    }
  }, [dispatch, setLoading, loadSubmissions, pagination.page, pagination.size, projectId]);

  const getSubmission = useCallback(async (id: string): Promise<Submission> => {
    try {
      const submission = await apiService.getSubmission(id);
      return submission;
    } catch (error) {
      console.error('Error getting submission:', error);
      throw error;
    }
  }, []);

  const getSubmissionProgress = useCallback(async (id: string) => {
    try {
      const progress = await apiService.getSubmissionProgress(id);
      return progress;
    } catch (error) {
      console.error('Error getting submission progress:', error);
      throw error;
    }
  }, []);

  const changePage = useCallback(async (newPage: number) => {
    await loadSubmissions(newPage, pagination.size, projectId);
  }, [loadSubmissions, pagination.size, projectId]);

  const changePageSize = useCallback(async (newSize: number) => {
    await loadSubmissions(1, newSize, projectId);
  }, [loadSubmissions, projectId]);

  // Load submissions when projectId changes or on mount
  useEffect(() => {
    if (projectId || state.submissions.length === 0) {
      loadSubmissions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]); // Only depend on projectId, not the callback

  return {
    submissions: state.submissions,
    loading: state.loadingStates.submissions,
    pagination,
    currentSubmission: state.currentSubmission,
    
    // Actions
    loadSubmissions,
    createSubmission,
    updateSubmission,
    deleteSubmission,
    getSubmission,
    getSubmissionProgress,
    changePage,
    changePageSize,
    
    // Setters
    setCurrentSubmission: (submission: Submission | null) => 
      dispatch({ type: 'SET_CURRENT_SUBMISSION', payload: submission }),
  };
};

export default useSubmissions;