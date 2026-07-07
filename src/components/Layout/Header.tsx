import { RefreshCw, Activity } from 'lucide-react';
import { useAppState } from '../../store/index';
import { useTickets } from '../../hooks/useTickets';

export default function Header() {
  const { state } = useAppState();
  const { handleResetQueue } = useTickets();
  const slaBreached = state.tickets.filter(t => t.status === 'Open' || t.status === 'Escalated').length;

  return (
    <header className="bg-white border-b border-slate-200 py-3 px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 text-sm text-slate-600">
          <Activity size={14} className="text-emerald-500" />
          <span className="font-medium text-slate-800">{state.tickets.length} Tickets</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500">{state.tickets.filter(t => t.status === 'Resolved').length} Resolved</span>
          {slaBreached > 0 && (
            <>
              <span className="text-slate-300">|</span>
              <span className="text-rose-600 font-medium">{slaBreached} Active</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-1.5 rounded-md border border-slate-200 flex items-center gap-1.5 font-mono">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          SLA Monitor Active
        </span>
        <button
          onClick={handleResetQueue}
          className="text-xs hover:bg-slate-100 text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-md border border-slate-200 flex items-center gap-1.5 transition-all duration-200"
        >
          <RefreshCw size={12} />
          Reset Queue
        </button>
      </div>
    </header>
  );
}
