import { useState } from 'react';
import { useAppState } from '../../store/index';
import { useTickets } from '../../hooks/useTickets';
import { Ticket } from '../../types/index';
import { Sparkles, ChevronRight, AlertTriangle, CheckCircle } from 'lucide-react';

interface Props {
  ticket: Ticket;
  isActive: boolean;
  onSelect: (id: string) => void;
}

export default function TicketItem({ ticket, isActive, onSelect }: Props) {
  const [isHovered, setIsHovered] = useState(false);
  const { dispatch } = useAppState();
  const { showToast } = useTickets();

  const sentimentColor = {
    Frustrated: 'border-rose-200 bg-rose-50 text-rose-700',
    Anxious: 'border-amber-200 bg-amber-50 text-amber-700',
    Neutral: 'border-slate-200 bg-slate-50 text-slate-600',
    Calm: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  }[ticket.sentiment];

  const tierColor = {
    Enterprise: 'border-purple-200 bg-purple-100 text-purple-800',
    SME: 'border-blue-200 bg-blue-100 text-blue-800',
    Free: 'border-gray-200 bg-gray-100 text-gray-700',
  }[ticket.tier];

  const statusColor = {
    Open: 'border-orange-200 bg-orange-100 text-orange-800',
    Resolved: 'border-emerald-200 bg-emerald-100 text-emerald-800',
    Escalated: 'border-rose-200 bg-rose-100 text-rose-800 font-semibold',
    'In Progress': 'border-blue-200 bg-blue-100 text-blue-800',
  }[ticket.status];

  const handleQuickResolve = async () => {
    try {
      const res = await fetch('/api/agent/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: ticket.id }),
      });
      if (res.ok) {
        const ticketsRes = await fetch('/api/tickets');
        const ticketsData = await ticketsRes.json();
        dispatch({ type: 'SET_TICKETS', payload: ticketsData });
        showToast(`Ticket ${ticket.id} resolved!`);
      }
    } catch {
      showToast('Error resolving ticket.');
    }
  };

  const handleQuickEscalate = async () => {
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Escalated', assignedTier: 3, agentNotes: 'Manually escalated via quick action.' }),
      });
      if (res.ok) {
        const updated = await res.json();
        dispatch({ type: 'UPDATE_TICKET', payload: { ...ticket, ...updated } });
        showToast(`Ticket ${ticket.id} escalated to Tier 3.`);
      }
    } catch {
      showToast('Error escalating ticket.');
    }
  };

  return (
    <div
      className={`relative group cursor-pointer transition-all duration-200 ${
        isActive ? 'bg-slate-100/80' : 'hover:bg-slate-50'
      } ${isHovered ? 'shadow-sm' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        onClick={() => onSelect(ticket.id)}
        className="w-full text-left p-4 flex flex-col space-y-1.5 relative"
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-medium text-slate-500">{ticket.id}</span>
          <span className="text-[10px] text-slate-400">{new Date(ticket.createdAt).toLocaleDateString()}</span>
        </div>
        <h3 className="text-xs font-semibold text-slate-900 line-clamp-1">{ticket.subject}</h3>
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center space-x-1.5">
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${sentimentColor}`}>{ticket.sentiment}</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${tierColor}`}>{ticket.tier}</span>
          </div>
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${statusColor}`}>{ticket.status}</span>
        </div>
        {ticket.assignedTier && (
          <div className="mt-1 flex items-center text-[9px] text-emerald-600 font-medium">
            <Sparkles size={10} className="mr-1" />
            Tier {ticket.assignedTier}
          </div>
        )}
      </div>

      {isHovered && ticket.status === 'Open' && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col space-y-1 transition-all duration-200">
          <button
            onClick={handleQuickResolve}
            className="bg-white hover:bg-emerald-50 border border-slate-200 text-slate-600 hover:text-emerald-600 p-1.5 rounded-md shadow-sm transition-colors"
            title="Quick Resolve"
          >
            <CheckCircle size={12} />
          </button>
          <button
            onClick={handleQuickEscalate}
            className="bg-white hover:bg-rose-50 border border-slate-200 text-slate-600 hover:text-rose-600 p-1.5 rounded-md shadow-sm transition-colors"
            title="Escalate to Tier 3"
          >
            <AlertTriangle size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
