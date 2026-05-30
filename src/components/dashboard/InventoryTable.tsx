const inventoryData = [
  { id: 'ST-003', name: 'LA Mega Hub', stock: '412,000', lowStock: 35, inTransit: '8,400', status: 'Warning' },
  { id: 'ST-004', name: 'NYC Hub', stock: '245,000', lowStock: 12, inTransit: '4,200', status: 'Operational' },
  { id: 'ST-005', name: 'Mumbai Central Hub', stock: '182,500', lowStock: 4, inTransit: '1,800', status: 'Operational' },
  { id: 'ST-006', name: 'Delhi NCR Hub', stock: '98,000', lowStock: 2, inTransit: '500', status: 'Operational' },
  { id: 'ST-007', name: 'Bangalore Tech Hub', stock: '145,200', lowStock: 18, inTransit: '3,100', status: 'Critical' },
];

export function InventoryTable() {
  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden flex flex-col h-full shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
      <div className="px-5 py-4 border-b border-border bg-surface flex justify-between items-center">
        <h3 className="text-base font-semibold text-foreground tracking-tight">Inventory Overview</h3>
        <button className="text-[13px] text-muted hover:text-foreground font-medium transition-colors border border-border/50 bg-background px-3 py-1.5 rounded-md hover:bg-surface-hover">View All</button>
      </div>
      <div className="overflow-x-auto flex-1 bg-background/50">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-surface text-muted text-[11px] font-medium sticky top-0 z-10 border-b border-border">
            <tr>
              <th className="px-5 py-3 text-left font-medium">Store</th>
              <th className="px-5 py-3 text-right font-medium">Stock Count</th>
              <th className="px-5 py-3 text-right font-medium">Low Stock</th>
              <th className="px-5 py-3 text-right font-medium">In Transit</th>
              <th className="px-5 py-3 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface/50">
            {inventoryData.map((row, idx) => (
              <tr key={idx} className="hover:bg-surface-hover transition-colors group cursor-default">
                <td className="px-5 py-3">
                  <div className="font-medium text-[13px] text-foreground group-hover:text-brand-500 transition-colors">{row.name}</div>
                  <div className="text-[11px] text-muted mt-0.5">{row.id}</div>
                </td>
                <td className="px-5 py-3 text-right font-mono text-[13px] text-foreground/90">{row.stock}</td>
                <td className="px-5 py-3 text-right font-mono text-[13px]">
                  <span className={row.lowStock > 20 ? 'text-danger font-semibold' : row.lowStock > 10 ? 'text-warning' : 'text-foreground/90'}>
                    {row.lowStock}
                  </span>
                </td>
                <td className="px-5 py-3 text-right font-mono text-[13px] text-muted">{row.inTransit}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                    row.status === 'Operational' ? 'bg-success/10 text-success border-success/20' :
                    row.status === 'Warning' ? 'bg-warning/10 text-warning border-warning/20' :
                    'bg-danger/10 text-danger border-danger/20'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                      row.status === 'Operational' ? 'bg-success' :
                      row.status === 'Warning' ? 'bg-warning' :
                      'bg-danger'
                    }`}></span>
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
