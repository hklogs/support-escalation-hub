import { useState, useMemo } from 'react';
import { useAppState } from '../../store/index';
import { useTickets } from '../../hooks/useTickets';
import TicketItem from './TicketItem';
import { Search, Plus, RefreshCw } from 'lucide-react';

interface Props {
  onOpenCreate: () => void;
}

export default function TicketList({ onOpenCreate }: Props) {
  const { state, dispatch } = useAppState();
  const { isLoading } = useTickets();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredTickets = useMemo(() => {
    return state.tickets.filter(t => {
      const matchSearch = t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.subject.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'All' || t.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [state.tickets, searchQuery, statusFilter]);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-slate-100 shrink-0 space-y-3 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
            <span>Active Queue</span>
            <span className="text-xs font-mono bg-slate-200 px-2 py-0.5 rounded-full text-slate-600">{state.tickets.length}</span>
          </h2>
          <button
            onClick={onOpenCreate}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs px-2.5 py-1.5 rounded-md flex items-center gap-1 shadow-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <Plus size={14} />
            New Ticket
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Search tickets, customers, companies..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 transition-all"
          />
        </div>

        <div className="flex bg-slate-200/60 p-1 rounded-md text-[10px] font-medium text-slate-600">
          {['All', 'Open', 'Resolved', 'Escalated'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`flex-1 py-1 rounded transition-all duration-200 text-center ${
                statusFilter === s ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'hover:text-slate-900'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400 space-y-2">
            <RefreshCw className="animate-spin mx-auto" size={20} />
            <p className="text-xs">Loading tickets...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <p className="text-xs font-medium">No matching tickets</p>
            <p className="text-[10px] mt-1">Adjust filters or create a custom ticket.</p>
          </div>
        ) : (
          filteredTickets.map((ticket: any) => (
            <div key={ticket.id}>
              <TicketItem
                ticket={ticket}
                isActive={state.activeTicketId === ticket.id}
                onSelect={id => dispatch({ type: 'SET_ACTIVE_TICKET', payload: id })}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
