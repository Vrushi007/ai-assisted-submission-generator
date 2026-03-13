import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Project, Submission, LoadingState } from '../types';

// State interface
interface AppState {
  currentProject: Project | null;
  currentSubmission: Submission | null;
  projects: Project[];
  submissions: Submission[];
  loadingStates: {
    projects: LoadingState;
    submissions: LoadingState;
    files: LoadingState;
    ai: LoadingState;
  };
  user: {
    name?: string;
    email?: string;
    role?: string;
  } | null;
}

// Action types
type AppAction =
  | { type: 'SET_CURRENT_PROJECT'; payload: Project | null }
  | { type: 'SET_CURRENT_SUBMISSION'; payload: Submission | null }
  | { type: 'SET_PROJECTS'; payload: Project[] }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: Project }
  | { type: 'REMOVE_PROJECT'; payload: string }
  | { type: 'SET_SUBMISSIONS'; payload: Submission[] }
  | { type: 'ADD_SUBMISSION'; payload: Submission }
  | { type: 'UPDATE_SUBMISSION'; payload: Submission }
  | { type: 'REMOVE_SUBMISSION'; payload: string }
  | { type: 'SET_LOADING'; payload: { key: keyof AppState['loadingStates']; loading: LoadingState } }
  | { type: 'SET_USER'; payload: AppState['user'] }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: AppState = {
  currentProject: null,
  currentSubmission: null,
  projects: [],
  submissions: [],
  loadingStates: {
    projects: { isLoading: false },
    submissions: { isLoading: false },
    files: { isLoading: false },
    ai: { isLoading: false },
  },
  user: null,
};

// Reducer
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_CURRENT_PROJECT':
      return {
        ...state,
        currentProject: action.payload,
        // Clear current submission if switching projects
        currentSubmission: action.payload?.id !== state.currentProject?.id ? null : state.currentSubmission,
      };

    case 'SET_CURRENT_SUBMISSION':
      return {
        ...state,
        currentSubmission: action.payload,
      };

    case 'SET_PROJECTS':
      return {
        ...state,
        projects: action.payload,
      };

    case 'ADD_PROJECT':
      return {
        ...state,
        projects: [...state.projects, action.payload],
      };

    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(project =>
          project.id === action.payload.id ? action.payload : project
        ),
        currentProject: state.currentProject?.id === action.payload.id ? action.payload : state.currentProject,
      };

    case 'REMOVE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter(project => project.id !== action.payload),
        currentProject: state.currentProject?.id === action.payload ? null : state.currentProject,
        currentSubmission: state.currentProject?.id === action.payload ? null : state.currentSubmission,
      };

    case 'SET_SUBMISSIONS':
      return {
        ...state,
        submissions: action.payload,
      };

    case 'ADD_SUBMISSION':
      return {
        ...state,
        submissions: [...state.submissions, action.payload],
      };

    case 'UPDATE_SUBMISSION':
      return {
        ...state,
        submissions: state.submissions.map(submission =>
          submission.id === action.payload.id ? action.payload : submission
        ),
        currentSubmission: state.currentSubmission?.id === action.payload.id ? action.payload : state.currentSubmission,
      };

    case 'REMOVE_SUBMISSION':
      return {
        ...state,
        submissions: state.submissions.filter(submission => submission.id !== action.payload),
        currentSubmission: state.currentSubmission?.id === action.payload ? null : state.currentSubmission,
      };

    case 'SET_LOADING':
      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          [action.payload.key]: action.payload.loading,
        },
      };

    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
      };

    case 'RESET_STATE':
      return initialState;

    default:
      return state;
  }
};

// Context
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // Helper functions
  setCurrentProject: (project: Project | null) => void;
  setCurrentSubmission: (submission: Submission | null) => void;
  setLoading: (key: keyof AppState['loadingStates'], isLoading: boolean, error?: string) => void;
  clearError: (key: keyof AppState['loadingStates']) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Helper functions
  const setCurrentProject = (project: Project | null) => {
    dispatch({ type: 'SET_CURRENT_PROJECT', payload: project });
  };

  const setCurrentSubmission = (submission: Submission | null) => {
    dispatch({ type: 'SET_CURRENT_SUBMISSION', payload: submission });
  };

  const setLoading = (key: keyof AppState['loadingStates'], isLoading: boolean, error?: string) => {
    dispatch({
      type: 'SET_LOADING',
      payload: {
        key,
        loading: { isLoading, error },
      },
    });
  };

  const clearError = (key: keyof AppState['loadingStates']) => {
    dispatch({
      type: 'SET_LOADING',
      payload: {
        key,
        loading: { isLoading: state.loadingStates[key].isLoading },
      },
    });
  };

  const contextValue: AppContextType = {
    state,
    dispatch,
    setCurrentProject,
    setCurrentSubmission,
    setLoading,
    clearError,
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

// Hook to use the context
export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;