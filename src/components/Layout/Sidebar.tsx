import { useAppState } from '../../store/index';
import { NavTab } from '../../types/index';
import { Inbox, Ticket, BookOpen, Terminal, Settings, Activity, FolderCode } from 'lucide-react';

const NAV_ITEMS: { id: NavTab; label: string; icon: typeof Inbox }[] = [
  { id: 'inbox', label: 'Dashboard', icon: Activity },
  { id: 'project', label: 'Project Analyzer', icon: FolderCode },
  { id: 'queue', label: 'Active Queue', icon: Ticket },
  { id: 'kedb', label: 'KEDB Library', icon: BookOpen },
  { id: 'ingress', label: 'Ingress Stream', icon: Terminal },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const { state, dispatch } = useAppState();
  const openCount = state.tickets.filter(t => t.status === 'Open').length;
  const escalatedCount = state.tickets.filter(t => t.status === 'Escalated').length;

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0 border-r border-slate-800">
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="bg-emerald-500 p-2 rounded-lg shadow-md">
            <Activity size={18} className="text-slate-900" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">Escalation Hub</h1>
            <p className="text-[10px] text-slate-400">Enterprise Support OS</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-3 space-y-1 px-3">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = state.activeNav === item.id;
          return (
            <button
              key={item.id}
              onClick={() => dispatch({ type: 'SET_NAV', payload: item.id })}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon size={16} className={`transition-transform duration-200 ${isActive ? 'text-emerald-400' : 'group-hover:scale-110'}`} />
              <span>{item.label}</span>
              {item.id === 'queue' && openCount > 0 && (
                <span className="ml-auto bg-orange-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold min-w-[18px] text-center">
                  {openCount}
                </span>
              )}
              {item.id === 'inbox' && escalatedCount > 0 && (
                <span className="ml-auto bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                  {escalatedCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 text-[10px] text-slate-500">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          System Online
        </div>
      </div>
    </aside>
  );
}
