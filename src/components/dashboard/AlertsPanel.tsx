import { AlertTriangle, Clock, XCircle, Info } from 'lucide-react';

const alerts = [
  { type: 'critical', title: 'Capacity Warning', desc: 'LA Mega reached 98% storage capacity. Redirecting incoming transfers.', time: '10m ago', icon: XCircle },
  { type: 'warning', title: 'Delayed Shipment', desc: 'TRX-8821 delayed due to traffic. ETA updated to 14:30.', time: '35m ago', icon: Clock },
  { type: 'warning', title: 'Low Stock', desc: 'SKU 99281 critical at Chicago Central (4 units remaining).', time: '1h ago', icon: AlertTriangle },
  { type: 'info', title: 'System Maintenance', desc: 'Scheduled API downtime at 02:00 UTC.', time: '3h ago', icon: Info },
];

export function AlertsPanel() {
  return (
    <div className="bg-surface border border-border rounded-md overflow-hidden flex flex-col h-full shadow-sm">
      <div className="px-4 py-3 border-b border-border bg-surface-hover/50 flex justify-between items-center">
        <h3 className="text-sm font-semibold text-foreground flex items-center">
          <AlertTriangle className="w-4 h-4 mr-2 text-muted" />
          Operational Alerts
        </h3>
        <span className="bg-danger-bg border border-danger/20 text-danger text-[10px] px-2 py-0.5 rounded-full font-bold">1 Critical</span>
      </div>
      <div className="p-0 overflow-y-auto flex-1">
        <div className="divide-y divide-border">
          {alerts.map((alert, idx) => {
            const Icon = alert.icon;
            return (
              <div key={idx} className="p-4 hover:bg-surface-hover/30 transition-colors flex gap-3">
                <div className={`mt-0.5 shrink-0 ${
                  alert.type === 'critical' ? 'text-danger' :
                  alert.type === 'warning' ? 'text-warning' : 'text-info'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground mb-1">{alert.title}</h4>
                  <p className="text-[11px] text-muted leading-relaxed mb-2">{alert.desc}</p>
                  <span className="text-[9px] text-muted font-mono uppercase tracking-wider">{alert.time}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
