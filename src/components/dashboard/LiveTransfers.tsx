import { PackageOpen, ArrowRight } from 'lucide-react';

const transfers = [
  { id: 'TRX-8821', source: 'LA Mega Hub', dest: 'Mumbai Central Hub', worker: 'Alex M.', cartons: 42, stage: 'In Transit' },
  { id: 'TRX-8822', source: 'NYC Hub', dest: 'Delhi NCR Hub', worker: 'Sarah K.', cartons: 18, stage: 'Assigned' },
  { id: 'TRX-8823', source: 'Delhi NCR Hub', dest: 'Bangalore Tech Hub', worker: 'Mike J.', cartons: 124, stage: 'Pending' },
  { id: 'TRX-8824', source: 'Mumbai Central Hub', dest: 'LA Mega Hub', worker: 'David W.', cartons: 8, stage: 'Picked Up' },
  { id: 'TRX-8825', source: 'Bangalore Tech Hub', dest: 'NYC Hub', worker: 'Lisa R.', cartons: 56, stage: 'Delivered' },
  { id: 'TRX-8826', source: 'LA Mega Hub', dest: 'Delhi NCR Hub', worker: 'Emma T.', cartons: 32, stage: 'Verified' },
];

export function LiveTransfers() {
  return (
    <div className="bg-surface border border-border rounded-md overflow-hidden flex flex-col h-full shadow-sm">
      <div className="px-4 py-3 border-b border-border bg-surface-hover/50 flex justify-between items-center">
        <h3 className="text-sm font-semibold text-foreground flex items-center">
          <PackageOpen className="w-4 h-4 mr-2 text-muted" />
          Live Transfers
        </h3>
        <span className="bg-brand-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">142 Active</span>
      </div>
      <div className="p-0 overflow-y-auto flex-1">
        <ul className="divide-y divide-border">
          {transfers.map((tx, idx) => (
            <li key={idx} className="p-3 hover:bg-surface-hover/30 transition-colors">
              <div className="flex justify-between items-start mb-1.5">
                <span className="text-xs font-mono font-semibold text-foreground">{tx.id}</span>
                <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                  tx.stage === 'Delivered' || tx.stage === 'Verified' ? 'bg-success-bg text-success' :
                  tx.stage === 'In Transit' ? 'bg-info-bg text-info' :
                  tx.stage === 'Pending' ? 'bg-warning-bg text-warning' : 'bg-surface-hover text-muted'
                }`}>
                  {tx.stage}
                </span>
              </div>
              <div className="flex items-center text-xs text-muted mb-2">
                <span className="truncate max-w-[100px]" title={tx.source}>{tx.source}</span>
                <ArrowRight className="w-3 h-3 mx-2 shrink-0" />
                <span className="truncate max-w-[100px]" title={tx.dest}>{tx.dest}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] text-muted">
                <span className="flex items-center">Worker: <span className="text-foreground ml-1 font-medium">{tx.worker}</span></span>
                <span className="font-mono bg-surface-hover border border-border px-1.5 py-0.5 rounded text-foreground">{tx.cartons} ctn</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
