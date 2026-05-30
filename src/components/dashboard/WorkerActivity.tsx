import { User } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export function WorkerActivity({ storeId }: { storeId?: string }) {
  const workforce = useAppStore(state => state.workforce);
  
  // Filter by storeId if provided, otherwise show all
  const filteredWorkers = storeId 
    ? workforce.filter(w => w.storeId === storeId)
    : workforce;
  return (
    <div className="bg-surface border border-border rounded-md overflow-hidden flex flex-col h-full shadow-sm">
      <div className="px-4 py-3 border-b border-border bg-surface-hover/50 flex justify-between items-center">
        <h3 className="text-sm font-semibold text-foreground flex items-center">
          <User className="w-4 h-4 mr-2 text-muted" />
          Worker Activity
        </h3>
        <button className="text-xs text-brand-500 hover:text-brand-400 font-medium">Manage</button>
      </div>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-surface-hover/30 text-muted uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-4 py-2 font-medium">Worker</th>
              <th className="px-4 py-2 font-medium">Current Task</th>
              <th className="px-4 py-2 font-medium text-right">Workload</th>
              <th className="px-4 py-2 font-medium">State</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredWorkers.map((w, idx) => {
              const displayRole = w.designation || w.role.replace('_', ' ');
              const displayTask = w.activeTaskId ? `Assigned to ${w.activeTaskId}` : (w.status === "ONLINE" ? "Standby" : (w.status === "OFFLINE" ? "Offline" : "Busy"));
              const displayWorkload = (w.status === "BUSY" || w.status === "ON_DELIVERY") ? "95%" : (w.status === "ONLINE" ? "10%" : "-");
              const isOffline = w.status === "OFFLINE";
              
              return (
              <tr key={w.id || idx} className="hover:bg-surface-hover/50 transition-colors">
                <td className="px-4 py-2.5 flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-surface-hover border border-border flex items-center justify-center font-bold text-[10px]">
                    {w.name.charAt(0)}{w.name.split(' ')[1]?.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium text-foreground">{w.name}</div>
                    <div className="text-[10px] text-muted">{displayRole}</div>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-muted">{displayTask}</td>
                <td className="px-4 py-2.5 text-right font-mono">{displayWorkload}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      w.status === 'ONLINE' ? 'bg-info' :
                      (w.status === 'BUSY' || w.status === 'ON_DELIVERY') ? 'bg-success' : 'bg-muted'
                    }`}></div>
                    <span className="text-[10px] text-muted uppercase tracking-wider">
                      {w.status.replace('_', ' ')}
                    </span>
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
