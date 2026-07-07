import { useCallback } from 'react';
import { useAppState } from '../store/index';
import { Ticket, AgentAnalysisResponse } from '../types/index';

export function useTickets() {
  const { state, dispatch } = useAppState();

  const fetchInitialData = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const [ticketsRes, kbRes] = await Promise.all([
        fetch('/api/tickets'),
        fetch('/api/kb'),
      ]);
      const ticketsData: Ticket[] = await ticketsRes.json();
      const kbData = await kbRes.json();
      dispatch({ type: 'SET_TICKETS', payload: ticketsData });
      dispatch({ type: 'SET_KB_ARTICLES', payload: kbData });
      const firstId = ticketsData[0]?.id;
      if (firstId) {
        dispatch({ type: 'SET_ACTIVE_TICKET', payload: firstId });
      }
      return ticketsData;
    } catch (err) {
      console.error('Error loading workspace data:', err);
      dispatch({ type: 'SHOW_TOAST', payload: 'Failed to load ticket data from server.' });
      return [];
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const analyzeTicket = useCallback(async (ticketId: string) => {
    dispatch({ type: 'SET_ANALYZING', payload: true });
    dispatch({ type: 'SET_ANALYSIS_STEP', payload: 1 });
    dispatch({ type: 'SET_ANALYSIS_NOTES', payload: 'Reading customer inquiry and assessing sentiment thresholds...' });

    setTimeout(() => {
      dispatch({ type: 'SET_ANALYSIS_STEP', payload: 2 });
      dispatch({ type: 'SET_ANALYSIS_NOTES', payload: 'Ingesting technical environment parameters and raw backend logs...' });
    }, 600);
    setTimeout(() => {
      dispatch({ type: 'SET_ANALYSIS_STEP', payload: 3 });
      dispatch({ type: 'SET_ANALYSIS_NOTES', payload: 'Searching Known Error Database (KEDB) for log traces and signatures...' });
    }, 1200);
    setTimeout(async () => {
      dispatch({ type: 'SET_ANALYSIS_STEP', payload: 4 });
      dispatch({ type: 'SET_ANALYSIS_NOTES', payload: 'Synthesizing final diagnostic evaluation and drafting resolution protocol...' });
      try {
        const res = await fetch('/api/agent/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticketId }),
        });
        if (res.ok) {
          const analysisResult: AgentAnalysisResponse = await res.json();
          const ticketsRes = await fetch('/api/tickets');
          const ticketsData: Ticket[] = await ticketsRes.json();
          dispatch({ type: 'SET_TICKETS', payload: ticketsData });
          dispatch({
            type: 'SHOW_TOAST',
            payload: analysisResult.assignedTier === 3
              ? 'Ticket escalated to Tier 3! Internal handover summary ready.'
              : 'Ticket resolved by Autonomous Agent! Solution drafted.',
          });
        }
      } catch {
        dispatch({ type: 'SHOW_TOAST', payload: 'Network error performing analysis.' });
      } finally {
        dispatch({ type: 'SET_ANALYZING', payload: false });
        dispatch({ type: 'SET_ANALYSIS_STEP', payload: 0 });
      }
    }, 2000);
  }, []);

  const activeTicket = state.tickets.find(t => t.id === state.activeTicketId) || null;

  const handleResetQueue = useCallback(async () => {
    try {
      const res = await fetch('/api/tickets/reset', { method: 'POST' });
      const data = await res.json();
      dispatch({ type: 'SET_TICKETS', payload: data.tickets });
      if (data.tickets.length > 0) {
        dispatch({ type: 'SET_ACTIVE_TICKET', payload: data.tickets[0].id });
      }
      dispatch({ type: 'SHOW_TOAST', payload: 'Ticket workspace reset successfully.' });
    } catch {
      dispatch({ type: 'SHOW_TOAST', payload: 'Failed to reset queue.' });
    }
  }, []);

  const handleRunAgent = useCallback(async () => {
    if (!activeTicket) return;
    await analyzeTicket(activeTicket.id);
  }, [activeTicket, analyzeTicket]);

  const showToast = useCallback((message: string) => {
    dispatch({ type: 'SHOW_TOAST', payload: message });
    setTimeout(() => dispatch({ type: 'HIDE_TOAST' }), 4000);
  }, []);

  return {
    tickets: state.tickets,
    activeTicket,
    isLoading: state.isLoading,
    isAnalyzing: state.isAnalyzing,
    analysisStep: state.analysisStep,
    analysisNotes: state.analysisNotes,
    fetchInitialData,
    handleResetQueue,
    handleRunAgent,
    analyzeTicket,
    showToast,
    dispatch,
  };
}
