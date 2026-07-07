import { useAppState } from '../../store/index';
import { Ticket, CheckCircle, AlertTriangle, Clock, TrendingUp, Users, Activity } from 'lucide-react';

export default function Inbox() {
  const { state } = useAppState();
  const { tickets } = state;

  const openCount = tickets.filter(t => t.status === 'Open').length;
  const resolvedCount = tickets.filter(t => t.status === 'Resolved').length;
  const escalatedCount = tickets.filter(t => t.status === 'Escalated').length;
  const enterpriseCount = tickets.filter(t => t.tier === 'Enterprise').length;

  const stats = [
    { label: 'Open Tickets', value: openCount, icon: Ticket, color: 'text-orange-500 bg-orange-50 border-orange-200' },
    { label: 'Resolved', value: resolvedCount, icon: CheckCircle, color: 'text-emerald-500 bg-emerald-50 border-emerald-200' },
    { label: 'Escalated', value: escalatedCount, icon: AlertTriangle, color: 'text-rose-500 bg-rose-50 border-rose-200' },
    { label: 'Enterprise SLA', value: enterpriseCount, icon: TrendingUp, color: 'text-purple-500 bg-purple-50 border-purple-200' },
  ];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto w-full">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Dashboard Overview</h2>
        <p className="text-xs text-slate-500 mt-1">Real-time support queue health and SLA metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`rounded-xl border ${stat.color} p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[11px] font-medium text-slate-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color.split(' ').slice(1).join(' ')}`}>
                  <Icon size={22} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 mb-4">
            <Activity size={14} />
            Queue Distribution
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Free Tier', count: tickets.filter(t => t.tier === 'Free').length, color: 'bg-slate-400' },
              { label: 'SME Tier', count: tickets.filter(t => t.tier === 'SME').length, color: 'bg-blue-500' },
              { label: 'Enterprise Tier', count: enterpriseCount, color: 'bg-purple-500' },
            ].map(item => {
              const pct = tickets.length > 0 ? (item.count / tickets.length) * 100 : 0;
              return (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">{item.label}</span>
                    <span className="font-mono text-slate-500">{item.count}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${item.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 mb-4">
            <Users size={14} />
            Recent Activity
          </h3>
          <div className="space-y-3">
            {tickets.slice(0, 4).map(t => (
              <div key={t.id} className="flex items-center gap-3 text-xs">
                <div className={`w-2 h-2 rounded-full ${t.status === 'Open' ? 'bg-orange-400' : t.status === 'Escalated' ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                <span className="font-mono text-slate-400 text-[10px]">{t.id}</span>
                <span className="flex-1 text-slate-600 truncate">{t.subject}</span>
                <span className="text-slate-400 text-[10px]">{new Date(t.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
