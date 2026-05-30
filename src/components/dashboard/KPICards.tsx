import { Store, Users, ArrowRightLeft, AlertOctagon } from 'lucide-react';

const kpis = [
  { label: 'Total Stores', value: '1,248', change: '+12 this week', icon: Store, status: 'neutral' },
  { label: 'Active Workers', value: '4,892', change: '98% capacity', icon: Users, status: 'success' },
  { label: 'Pending Transfers', value: '342', change: '-45 from yesterday', icon: ArrowRightLeft, status: 'warning' },
  { label: 'Low Stock Alerts', value: '28', change: 'Action required', icon: AlertOctagon, status: 'danger' },
];

export function KPICards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {kpis.map((kpi, idx) => {
        const Icon = kpi.icon;
        return (
          <div key={idx} className="bg-surface rounded-xl p-5 flex flex-col shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] border border-border hover:border-muted/50 transition-colors">
            <div className="flex justify-between items-start mb-3">
              <span className="text-muted/90 text-[13px] font-medium">{kpi.label}</span>
              <div className="p-1.5 bg-background rounded-md border border-border/50">
                <Icon className="w-4 h-4 text-muted" />
              </div>
            </div>
            <div className="text-3xl font-semibold tracking-tight text-foreground mb-2">{kpi.value}</div>
            <div className={`text-[12px] font-medium flex items-center ${
              kpi.status === 'success' ? 'text-success' : 
              kpi.status === 'warning' ? 'text-warning' : 
              kpi.status === 'danger' ? 'text-danger' : 'text-muted'
            }`}>
              {kpi.change}
            </div>
          </div>
        );
      })}
    </div>
  );
}
