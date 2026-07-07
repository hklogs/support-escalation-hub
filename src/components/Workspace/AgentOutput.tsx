import { useState, useEffect } from 'react';
import { useAppState } from '../../store/index';
import { useTickets } from '../../hooks/useTickets';
import HandoverSummary from './HandoverSummary';
import { Ticket } from '../../types/index';
import { Bot, CheckCircle, BookOpen, Sparkles, Copy, Send, Check, Edit2, Cpu } from 'lucide-react';

interface Props {
  ticket: Ticket;
}

export default function AgentOutput({ ticket }: Props) {
  const { state, dispatch } = useAppState();
  const { handleRunAgent, showToast } = useTickets();
  const [editableResponse, setEditableResponse] = useState(ticket.agentResponse || '');
  const [isEditingMode, setIsEditingMode] = useState(false);

  useEffect(() => {
    setEditableResponse(ticket.agentResponse || '');
    setIsEditingMode(false);
  }, [ticket.id]);

  const getKBArticleMatch = () => {
    const desc = (ticket.subject + ' ' + ticket.description).toLowerCase();
    if (desc.includes('double charge') || desc.includes('subscription') || desc.includes('billing') || desc.includes('refund'))
      return state.kbArticles.find(a => a.id === 'KB-101') || null;
    if (desc.includes('signature') || desc.includes('webhook') || desc.includes('401'))
      return state.kbArticles.find(a => a.id === 'KB-202') || null;
    if (desc.includes('rotate') || desc.includes('rotation') || desc.includes('credentials'))
      return state.kbArticles.find(a => a.id === 'KB-205') || null;
    if (desc.includes('pool') || desc.includes('exhaustion') || desc.includes('504') || desc.includes('postgresql'))
      return state.kbArticles.find(a => a.id === 'KB-301') || null;
    return null;
  };

  const matchedKB = getKBArticleMatch();

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard.`);
  };

  const handleSaveResponse = async () => {
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentResponse: editableResponse, status: 'Resolved' }),
      });
      if (res.ok) {
        const updated = await res.json();
        dispatch({ type: 'UPDATE_TICKET', payload: { ...ticket, ...updated } });
        setIsEditingMode(false);
        showToast('Response saved. Ticket resolved.');
      }
    } catch {
      showToast('Error saving response.');
    }
  };

  if (!ticket.assignedTier) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 py-3.5 px-5">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Bot size={15} className="text-slate-600" />Agent Output
          </h3>
        </div>
        <div className="p-8 text-center max-w-sm mx-auto space-y-4">
          <div className="bg-slate-100 p-4 rounded-full w-14 h-14 flex items-center justify-center mx-auto text-slate-500">
            <Cpu size={24} />
          </div>
          <div className="space-y-1">
            <h4 className="font-semibold text-xs text-slate-800">No Diagnosis Yet</h4>
            <p className="text-[11px] text-slate-500">Run the AI Escalation Agent to analyze this ticket.</p>
          </div>
          <button
            onClick={handleRunAgent}
            disabled={state.isAnalyzing}
            className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white px-4 py-2 rounded-md text-xs font-medium w-full shadow transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
          >
            {state.isAnalyzing ? 'Processing...' : 'Analyze Now'}
          </button>
        </div>
      </div>
    );
  }

  const getSentimentColor = (s: string) => {
    switch (s) {
      case 'Frustrated': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Anxious': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Neutral': return 'bg-slate-50 text-slate-700 border-slate-200';
      case 'Calm': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-200 py-3.5 px-5 flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Bot size={15} className="text-slate-600" />Agent Diagnostic Output
        </h3>
        <span className="text-xs font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1 font-medium">
          <CheckCircle size={11} />Autopilot Complete
        </span>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tier Assignment</span>
            <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${ticket.assignedTier === 3 ? 'bg-rose-500' : ticket.assignedTier === 2 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              Tier {ticket.assignedTier} &mdash; {ticket.assignedTier === 3 ? 'Infrastructure' : ticket.assignedTier === 2 ? 'Technical' : 'General'}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sentiment</span>
            <span className={`text-[10px] px-2 py-0.5 rounded border inline-block ${getSentimentColor(ticket.sentiment)}`}>{ticket.sentiment}</span>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">KEDB Match</span>
            {matchedKB ? (
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 flex items-center gap-1 text-[10px] max-w-full truncate">
                <BookOpen size={10} />{matchedKB.id}: {matchedKB.title}
              </span>
            ) : (
              <span className="text-slate-400 italic text-[10px]">No strong match</span>
            )}
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-xs text-slate-600 leading-relaxed">
          <strong className="text-slate-800 block mb-1">Agent Reasoning:</strong>
          {ticket.agentNotes}
        </div>

        {ticket.assignedTier === 3 && ticket.handoverSummary && (
          <HandoverSummarySummary
            ticket={ticket}
            isEditingMode={isEditingMode}
            setIsEditingMode={setIsEditingMode}
            onCopy={handleCopy}
          />
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <Send size={12} />Customer Response Draft
            </label>
            <button
              onClick={() => handleCopy(editableResponse, 'Response')}
              className="text-[10px] text-slate-500 hover:text-slate-800 flex items-center gap-1.5"
            >
              <Copy size={11} /> Copy
            </button>
          </div>
          <textarea
            rows={6}
            value={editableResponse}
            onChange={e => setEditableResponse(e.target.value)}
            className="w-full p-3.5 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-900 focus:outline-none focus:bg-white leading-relaxed whitespace-pre-wrap transition-all"
          />
          {ticket.assignedTier !== 3 && (
            <div className="flex justify-end pt-2">
              <button
                onClick={handleSaveResponse}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4 py-2 rounded-lg font-medium flex items-center gap-1.5 shadow transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
              >
                <Check size={14} />Send & Resolve
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HandoverSummarySummary({ ticket, isEditingMode, setIsEditingMode, onCopy }: any) {
  const { dispatch } = useAppState();
  const { showToast } = useTickets();
  const [editable, setEditable] = useState(ticket.handoverSummary);

  useEffect(() => {
    setEditable(ticket.handoverSummary);
  }, [ticket.handoverSummary]);

  const handleSaveHandover = async () => {
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handoverSummary: editable, status: 'Escalated' }),
      });
      if (res.ok) {
        showToast('Escalation dispatched to engineering!');
        setIsEditingMode(false);
      }
    } catch {
      showToast('Error dispatching handover.');
    }
  };

  if (!editable) return null;

  return (
    <div className="border border-rose-200 bg-rose-50/20 rounded-xl overflow-hidden shadow-sm">
      <div className="bg-rose-900 text-white py-3 px-5 flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
          <span className="text-rose-300">[ESC-{ticket.id}]</span>INTERNAL HANDOVER (Tier 3)
        </h4>
        <button
          onClick={() => {
            const text = `[ESC-${ticket.id}] HANDOVER\nImpact: ${editable.customerImpact}\nDefect: ${editable.defectSummary}\nRoot Cause: ${editable.rootCauseHypothesis}\nEnvironment: ${editable.environmentSpecs}\nNext Steps: ${editable.nextSteps}`;
            onCopy(text, 'Handover');
          }}
          className="text-rose-100 hover:text-white bg-rose-950/60 hover:bg-rose-950 text-[10px] py-1 px-2 rounded-md flex items-center gap-1 transition-all"
        >
          <Copy size={11} /> Copy
        </button>
      </div>
      <div className="p-5 space-y-4">
        {!isEditingMode ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
            <div><span className="font-semibold block">Impact:</span><div className="p-2 bg-white border rounded mt-1">{editable.customerImpact}</div></div>
            <div><span className="font-semibold block">Defect:</span><div className="p-2 bg-white border rounded mt-1">{editable.defectSummary}</div></div>
            <div className="md:col-span-2"><span className="font-semibold block">Root Cause:</span><div className="p-2 bg-white border rounded mt-1">{editable.rootCauseHypothesis}</div></div>
            <div><span className="font-semibold block">Environment:</span><div className="p-2 bg-white border rounded mt-1 font-mono text-[11px]">{editable.environmentSpecs}</div></div>
            <div><span className="font-semibold block">Next Steps:</span><div className="p-2 bg-white border rounded mt-1">{editable.nextSteps}</div></div>
          </div>
        ) : (
          <div className="space-y-3 text-xs">
            {['customerImpact', 'defectSummary', 'rootCauseHypothesis', 'environmentSpecs', 'nextSteps'].map(field => (
              <div key={field}>
                <label className="font-semibold text-slate-900 block capitalize">{field.replace(/([A-Z])/g, ' $1')}:</label>
                <input
                  type="text"
                  value={(editable as any)[field] || ''}
                  onChange={e => setEditable({ ...editable, [field]: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-rose-500 text-xs"
                />
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between border-t border-rose-100 pt-4">
          <span className="text-[11px] text-rose-800 italic">Ready for Jira/Slack/Linear sync</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditingMode(!isEditingMode)}
              className="text-xs bg-white hover:bg-slate-100 text-slate-700 px-3 py-1.5 border border-slate-300 rounded flex items-center gap-1 transition-all"
            >
              <Edit2 size={12} />{isEditingMode ? 'Preview' : 'Edit'}
            </button>
            <button
              onClick={handleSaveHandover}
              className="text-xs bg-rose-900 hover:bg-rose-800 text-white px-3 py-1.5 rounded flex items-center gap-1.5 font-semibold shadow transition-all"
            >
              <Send size={12} />Dispatch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
