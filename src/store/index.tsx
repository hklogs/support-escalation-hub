import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { Ticket, KBArticle, NavTab } from '../types/index';

interface AppState {
  tickets: Ticket[];
  kbArticles: KBArticle[];
  activeTicketId: string | null;
  activeNav: NavTab;
  isLoading: boolean;
  isAnalyzing: boolean;
  analysisStep: number;
  analysisNotes: string;
  toastMessage: string | null;
  isOnboarding: boolean;
  isCredentialModalOpen: boolean;
  missingCredentials: string[];
}

type Action =
  | { type: 'SET_ONBOARDING_DONE' }
  | { type: 'SET_TICKETS'; payload: Ticket[] }
  | { type: 'SET_KB_ARTICLES'; payload: KBArticle[] }
  | { type: 'SET_ACTIVE_TICKET'; payload: string | null }
  | { type: 'SET_NAV'; payload: NavTab }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ANALYZING'; payload: boolean }
  | { type: 'SET_ANALYSIS_STEP'; payload: number }
  | { type: 'SET_ANALYSIS_NOTES'; payload: string }
  | { type: 'SHOW_TOAST'; payload: string }
  | { type: 'HIDE_TOAST' }
  | { type: 'SET_CREDENTIAL_MODAL'; payload: { open: boolean; missing: string[] } }
  | { type: 'UPDATE_TICKET'; payload: Ticket };

const initialState: AppState = {
  tickets: [],
  kbArticles: [],
  activeTicketId: null,
  activeNav: 'inbox',
  isLoading: true,
  isAnalyzing: false,
  analysisStep: 0,
  analysisNotes: '',
  toastMessage: null,
  isOnboarding: true,
  isCredentialModalOpen: false,
  missingCredentials: [],
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_ONBOARDING_DONE':
      return { ...state, isOnboarding: false };
    case 'SET_TICKETS':
      return { ...state, tickets: action.payload };
    case 'SET_KB_ARTICLES':
      return { ...state, kbArticles: action.payload };
    case 'SET_ACTIVE_TICKET':
      return { ...state, activeTicketId: action.payload };
    case 'SET_NAV':
      return { ...state, activeNav: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ANALYZING':
      return { ...state, isAnalyzing: action.payload };
    case 'SET_ANALYSIS_STEP':
      return { ...state, analysisStep: action.payload };
    case 'SET_ANALYSIS_NOTES':
      return { ...state, analysisNotes: action.payload };
    case 'SHOW_TOAST':
      return { ...state, toastMessage: action.payload };
    case 'HIDE_TOAST':
      return { ...state, toastMessage: null };
    case 'SET_CREDENTIAL_MODAL':
      return { ...state, isCredentialModalOpen: action.payload.open, missingCredentials: action.payload.missing };
    case 'UPDATE_TICKET':
      return {
        ...state,
        tickets: state.tickets.map(t => t.id === action.payload.id ? action.payload : t),
      };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return React.createElement(AppContext.Provider, { value: { state, dispatch } }, children);
}

export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used within AppProvider');
  return ctx;
}
