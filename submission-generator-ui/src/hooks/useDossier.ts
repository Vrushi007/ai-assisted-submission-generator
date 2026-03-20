import { useState, useEffect, useCallback } from "react";
import { apiService } from "../services/api";

export interface DossierSection {
  id: string;
  section_code: string;
  section_title: string;
  section_description: string;
  is_required: boolean;
  status: "not_started" | "in_progress" | "completed" | "under_review";
  completion_percentage: number;
  order_index: number;
  content_requirements: string[];
  has_content: boolean;
  content?: string;
  ai_extracted_content?: string;
  ai_confidence_score?: number;
  children: DossierSection[];
}

export interface DossierStructure {
  submission_id: string;
  submission_name: string;
  submission_type: string;
  dossier_sections: DossierSection[];
  total_sections: number;
  template_info: {
    template_name: string;
    version: string;
  };
}

export interface DossierSectionDetail {
  id: string;
  section_code: string;
  section_title: string;
  section_description: string;
  is_required: boolean;
  status: string;
  completion_percentage: number;
  content_requirements: string[];
  content: string;
  ai_extracted_content?: string;
  ai_confidence_score?: number;
  placeholder_content: string;
  created_at: string;
  updated_at: string;
}

export const useDossier = (submissionId?: string) => {
  const [dossier, setDossier] = useState<DossierStructure | null>(null);
  const [selectedSection, setSelectedSection] =
    useState<DossierSectionDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDossier = useCallback(async (id: string) => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const dossierData = await apiService.getSubmissionDossier(id);
      setDossier(dossierData);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load dossier");
      console.error("Error loading dossier:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSection = useCallback(
    async (submissionId: string, sectionId: string) => {
      setLoading(true);
      setError(null);

    try {
      const sectionData = await apiService.getDossierSection(
        submissionId,
        sectionId,
      );
      setSelectedSection(sectionData);
    } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load section");
        console.error("Error loading section:", err);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const updateSectionContent = useCallback(
    async (
      submissionId: string,
      sectionId: string,
      content: string,
      updatedBy?: string,
    ) => {
      setLoading(true);
      setError(null);

      try {
        await apiService.updateDossierSectionContent(
          submissionId,
          sectionId,
          content,
          updatedBy,
        );

        // Reload the section to get updated data
        await loadSection(submissionId, sectionId);

        // Reload the full dossier to update completion status
        await loadDossier(submissionId);

        return true;
      } catch (err: any) {
        setError(
          err.response?.data?.detail || "Failed to update section content",
        );
        console.error("Error updating section content:", err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [loadSection, loadDossier],
  );

  const markSectionComplete = useCallback(
    async (submissionId: string, sectionId: string, completedBy?: string) => {
      setLoading(true);
      setError(null);

      // Optimistically update the dossier state immediately
      const updateSectionInDossier = (
        sections: any[],
        sectionId: string,
      ): any[] => {
        return sections.map((section) => {
          if (section.id === sectionId) {
            return {
              ...section,
              status: "completed",
              completion_percentage: 100,
            };
          }
          if (section.children && section.children.length > 0) {
            return {
              ...section,
              children: updateSectionInDossier(section.children, sectionId),
            };
          }
          return section;
        });
      };

      if (dossier) {
        const updatedDossier = {
          ...dossier,
          dossier_sections: updateSectionInDossier(
            dossier.dossier_sections,
            sectionId,
          ),
        };
      setDossier(updatedDossier);
    }

    // Also optimistically update selectedSection if it's the same section
    if (selectedSection && selectedSection.id === sectionId) {
      setSelectedSection({
        ...selectedSection,
        status: "completed",
        completion_percentage: 100,
      });
    }

    try {
      await apiService.markDossierSectionComplete(
        submissionId,
        sectionId,
        completedBy,
      );

      // Reload the section to get updated data
      await loadSection(submissionId, sectionId);

      // Reload the full dossier to update completion status
      await loadDossier(submissionId);

        return true;
      } catch (err: any) {
        setError(
          err.response?.data?.detail || "Failed to mark section complete",
        );
        console.error("Error marking section complete:", err);

        // Revert optimistic update on error
        await loadDossier(submissionId);

        return false;
      } finally {
        setLoading(false);
      }
    },
    [loadSection, loadDossier, dossier],
  );

  const regenerateDossier = useCallback(
    async (submissionId: string) => {
      setLoading(true);
      setError(null);

      try {
        await apiService.regenerateSubmissionDossier(submissionId);

        // Reload the dossier after regeneration
        await loadDossier(submissionId);

        return true;
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to regenerate dossier");
        console.error("Error regenerating dossier:", err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [loadDossier],
  );

  const getDossierStats = useCallback(() => {
    if (!dossier) return null;

    const allSections = getAllSections(dossier.dossier_sections);
    const totalSections = allSections.length;
    const completedSections = allSections.filter(
      (s) => s.status === "completed",
    ).length;
    const inProgressSections = allSections.filter(
      (s) => s.status === "in_progress",
    ).length;
    const notStartedSections = allSections.filter(
      (s) => s.status === "not_started",
    ).length;
    const requiredSections = allSections.filter((s) => s.is_required).length;
    const requiredCompleted = allSections.filter(
      (s) => s.is_required && s.status === "completed",
    ).length;

    const overallCompletion =
      totalSections > 0
        ? Math.round((completedSections / totalSections) * 100)
        : 0;

    const requiredCompletion =
      requiredSections > 0
        ? Math.round((requiredCompleted / requiredSections) * 100)
        : 0;

    return {
      totalSections,
      completedSections,
      inProgressSections,
      notStartedSections,
      requiredSections,
      requiredCompleted,
      overallCompletion,
      requiredCompletion,
    };
  }, [dossier]);

  // Helper function to flatten nested sections
  const getAllSections = (sections: DossierSection[]): DossierSection[] => {
    const result: DossierSection[] = [];

    for (const section of sections) {
      result.push(section);
      if (section.children && section.children.length > 0) {
        result.push(...getAllSections(section.children));
      }
    }

    return result;
  };

  // Load dossier when submissionId changes
  useEffect(() => {
    if (submissionId) {
      loadDossier(submissionId);
    }
  }, [submissionId, loadDossier]);

  return {
    dossier,
    selectedSection,
    loading,
    error,
    loadDossier,
    loadSection,
    updateSectionContent,
    markSectionComplete,
    regenerateDossier,
    getDossierStats,
    setError,
    setSelectedSection,
  };
};

export default useDossier;
