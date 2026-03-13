import { useState, useCallback } from 'react';
import { apiService } from '../services/api';

export interface AIProcessingResult {
  file_id: string;
  submission_id: string;
  extraction_result: {
    document_content: {
      text: string;
      metadata: any;
      page_count?: number;
      file_type: string;
      extraction_method: string;
    };
    section_mappings: Array<{
      section_id: string;
      section_code: string;
      section_title: string;
      extracted_content: string;
      confidence_score: number;
      keywords_matched: string[];
    }>;
    processing_time: number;
    success: boolean;
    error_message?: string;
  };
  sections_updated: string[];
  message: string;
}

export interface ContentSuggestion {
  section_id: string;
  suggested_content: string;
  confidence_score: number;
  source_files: string[];
  reasoning: string;
}

export interface SubmissionAnalysis {
  submission_id: string;
  analysis: {
    total_sections: number;
    completed_sections: number;
    ai_assisted_sections: number;
    manual_sections: number;
    completion_percentage: number;
    missing_sections: Array<{
      section_code: string;
      section_title: string;
      is_required: boolean;
      has_ai_content: boolean;
    }>;
    ai_coverage: number;
  };
  timestamp: number;
}

export interface AIStats {
  ai_processing_stats: {
    total_sections: number;
    ai_processed_sections: number;
    ai_coverage_percentage: number;
    average_confidence_score: number;
    processing_success_rate: number;
  };
  timestamp: number;
}

export const useAI = () => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback(async (
    fileId: string, 
    submissionId: string, 
    options: any = {}
  ): Promise<AIProcessingResult | null> => {
    setProcessing(true);
    setError(null);
    
    try {
      const result = await apiService.processFileWithAI(fileId, submissionId, options);
      return result;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'AI processing failed';
      setError(errorMessage);
      return null;
    } finally {
      setProcessing(false);
    }
  }, []);

  const getSuggestions = useCallback(async (sectionId: string): Promise<ContentSuggestion[]> => {
    setError(null);
    
    try {
      const suggestions = await apiService.getSectionContentSuggestions(sectionId);
      return suggestions;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to get suggestions';
      setError(errorMessage);
      return [];
    }
  }, []);

  const analyzeSubmission = useCallback(async (submissionId: string): Promise<SubmissionAnalysis | null> => {
    setError(null);
    
    try {
      const analysis = await apiService.analyzeSubmissionCompleteness(submissionId);
      return analysis;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Analysis failed';
      setError(errorMessage);
      return null;
    }
  }, []);

  const autoPopulate = useCallback(async (submissionId: string): Promise<any> => {
    setProcessing(true);
    setError(null);
    
    try {
      const result = await apiService.autoPopulateSubmission(submissionId);
      return result;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Auto-population failed';
      setError(errorMessage);
      return null;
    } finally {
      setProcessing(false);
    }
  }, []);

  const getStats = useCallback(async (): Promise<AIStats | null> => {
    setError(null);
    
    try {
      const stats = await apiService.getAIProcessingStats();
      return stats;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to get AI stats';
      setError(errorMessage);
      return null;
    }
  }, []);

  const extractText = useCallback(async (fileId: string): Promise<any> => {
    setError(null);
    
    try {
      const result = await apiService.extractTextFromFile(fileId);
      return result;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Text extraction failed';
      setError(errorMessage);
      return null;
    }
  }, []);

  const generateContent = useCallback(async (sectionId: string): Promise<any> => {
    setProcessing(true);
    setError(null);
    
    try {
      const result = await apiService.generateSectionContent(sectionId);
      return result;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Content generation failed';
      setError(errorMessage);
      return null;
    } finally {
      setProcessing(false);
    }
  }, []);

  const analyzeDocuments = useCallback(async (submissionId: string): Promise<any> => {
    setProcessing(true);
    setError(null);
    
    try {
      const result = await apiService.analyzeDocumentCompleteness(submissionId);
      return result;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Document analysis failed';
      setError(errorMessage);
      return null;
    } finally {
      setProcessing(false);
    }
  }, []);

  const getServiceStatus = useCallback(async (): Promise<any> => {
    setError(null);
    
    try {
      const result = await apiService.getAIServiceStatus();
      return result;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to get AI status';
      setError(errorMessage);
      return null;
    }
  }, []);

  const getTaskStatus = useCallback(async (taskId: string): Promise<any> => {
    setError(null);
    
    try {
      const result = await apiService.getTaskStatus(taskId);
      return result;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to get task status';
      setError(errorMessage);
      return null;
    }
  }, []);

  const getActiveTasksForSubmission = useCallback(async (submissionId: string): Promise<any> => {
    setError(null);
    
    try {
      const result = await apiService.getActiveTasksForSubmission(submissionId);
      return result;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to get active tasks';
      setError(errorMessage);
      return null;
    }
  }, []);

  return {
    processing,
    error,
    processFile,
    getSuggestions,
    analyzeSubmission,
    autoPopulate,
    getStats,
    extractText,
    generateContent,
    analyzeDocuments,
    getServiceStatus,
    getTaskStatus,
    getActiveTasksForSubmission,
    setError
  };
};

export default useAI;