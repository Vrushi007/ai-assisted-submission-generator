// Core entity types
export interface Project {
  id: string;
  name: string;
  description?: string;
  client_name: string;
  client_contact_email?: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
  products_count?: number;
  submissions_count?: number;
  files_count?: number;
}

export interface Product {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  device_type: string;
  intended_use: string;
  regulation_type: RegulationType;
  risk_classification: RiskClassification;
  model_numbers?: string[];
  manufacturer?: string;
  created_at: string;
  updated_at: string;
  submissions_count?: number;
}

export interface Submission {
  id: string;
  project_id: string;
  product_id: string;
  name: string;
  submission_type?: string;
  status: SubmissionStatus;
  health_canada_reference?: string;
  target_submission_date?: string;
  created_at: string;
  updated_at: string;
  completion_percentage?: number;
  dossier_sections_count?: number;
}

export interface DossierSection {
  id: string;
  submission_id: string;
  parent_section_id?: string;
  section_code: string;
  section_title: string;
  section_description?: string;
  is_required: boolean;
  is_completed: boolean;
  order_index: number;
  completion_percentage: number;
  template_source?: string;
  created_at: string;
  updated_at: string;
  child_sections_count?: number;
  extracted_content_count?: number;
  reviews_count?: number;
  missing_content_alerts?: number;
}

export interface UploadedFile {
  id: string;
  project_id: string;
  submission_id?: string;
  original_filename: string;
  stored_filename: string;
  file_path: string;
  file_size: number;
  file_type: FileType;
  mime_type: string;
  file_hash: string;
  upload_purpose?: string;
  uploaded_by?: string;
  is_processed: boolean;
  created_at: string;
  updated_at: string;
  extracted_content_count?: number;
  download_url?: string;
  preview_available?: boolean;
}

export interface ExtractedContent {
  id: string;
  file_id: string;
  content_text: string;
  content_type: string;
  confidence_score: number;
  page_number?: number;
  extraction_method: string;
  processing_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface HumanReview {
  id: string;
  reviewable_type: ReviewableType;
  reviewable_id: string;
  reviewer_name?: string;
  review_status: ReviewStatus;
  review_comments?: string;
  decision?: string;
  created_at: string;
  updated_at: string;
}

// Enums
export enum ProjectStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum RegulationType {
  IVD = 'IVD',
  NON_IVD = 'non_IVD'
}

export enum RiskClassification {
  CLASS_I = 'Class_I',
  CLASS_II = 'Class_II',
  CLASS_III = 'Class_III',
  CLASS_IV = 'Class_IV'
}

export enum SubmissionStatus {
  DRAFT = 'draft',
  AI_PROCESSING = 'ai_processing',
  HUMAN_REVIEW = 'human_review',
  APPROVED = 'approved',
  SUBMITTED = 'submitted',
  REJECTED = 'rejected'
}

export enum FileType {
  PDF = 'pdf',
  DOCX = 'docx',
  XLSX = 'xlsx',
  OTHER = 'other'
}

export enum ReviewableType {
  DOSSIER_SECTION = 'dossier_section',
  SUBMISSION = 'submission',
  EXTRACTED_CONTENT = 'extracted_content'
}

export enum ReviewStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  NEEDS_REVISION = 'needs_revision'
}

// AI-related types
export interface AIExtractionResponse {
  extraction_id: string;
  file_id: string;
  status: string;
  started_at: string;
  completed_at?: string;
  extracted_items_count: number;
  processing_time_seconds?: number;
  error_message?: string;
}

export interface AIContentSuggestion {
  suggestion_type: string;
  section_category: string;
  title: string;
  description: string;
  suggested_content: string;
  confidence_score: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  rationale: string;
}

export interface AISectionMapping {
  section_id: string;
  section_code: string;
  section_title: string;
  content_category: string;
  content_snippet: string;
  confidence_score: number;
  suggested_action: 'auto_populate' | 'review_and_approve' | 'manual_review';
  reasoning: string;
}

export interface AIQualityMetrics {
  model_name: string;
  accuracy_score: number;
  precision_score?: number;
  recall_score?: number;
  f1_score?: number;
  processing_speed?: number;
  error_rate?: number;
  last_evaluated: string;
  evaluation_dataset_size?: number;
}

export interface AIModelInfo {
  model_name: string;
  model_version: string;
  model_type: string;
  description?: string;
  capabilities: string[];
  supported_file_types: string[];
  is_active: boolean;
  last_updated: string;
}

// API Response types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface MessageResponse {
  message: string;
}

// Form types
export interface ProjectFormData {
  name: string;
  description?: string;
  client_name: string;
  client_contact_email?: string;
  status: ProjectStatus;
}

export interface ProductFormData {
  name: string;
  description?: string;
  device_type: string;
  intended_use: string;
  regulation_type: RegulationType;
  risk_classification: RiskClassification;
  model_numbers?: string[];
  manufacturer?: string;
}

export interface SubmissionFormData {
  name: string;
  submission_type?: string;
  product_id: string;
  target_submission_date?: string;
  created_by?: string;
}

// UI State types
export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

export interface TableColumn<T> {
  id: keyof T;
  label: string;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  format?: (value: any) => string;
}

export interface FilterState {
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  [key: string]: any;
}

// Navigation types
export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon?: React.ComponentType;
  children?: NavItem[];
}

// Dashboard types
export interface DashboardStats {
  total_projects: number;
  active_projects: number;
  total_submissions: number;
  pending_reviews: number;
  files_processed: number;
  ai_extractions_today: number;
}

export interface RecentActivity {
  id: string;
  type: 'project_created' | 'submission_updated' | 'file_uploaded' | 'review_completed';
  title: string;
  description: string;
  timestamp: string;
  user?: string;
}

// File upload types
export interface FileUploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  result?: UploadedFile;
}

export interface BatchUploadResult {
  successful: Array<{
    filename: string;
    file_id: string;
    size: number;
  }>;
  failed: Array<{
    filename: string;
    error: string;
  }>;
  total_files: number;
  total_size: number;
}

// Theme types
export interface ThemeMode {
  mode: 'light' | 'dark';
  toggleMode: () => void;
}