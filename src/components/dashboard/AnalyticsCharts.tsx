"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const movementData = [
  { name: 'Mon', in: 4000, out: 2400 },
  { name: 'Tue', in: 3000, out: 1398 },
  { name: 'Wed', in: 2000, out: 9800 },
  { name: 'Thu', in: 2780, out: 3908 },
  { name: 'Fri', in: 1890, out: 4800 },
  { name: 'Sat', in: 2390, out: 3800 },
  { name: 'Sun', in: 3490, out: 4300 },
];

export function AnalyticsCharts() {
  return (
    <div className="bg-surface border border-border rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.1)] h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-base font-semibold text-foreground tracking-tight">Inventory Movement</h3>
        <select className="bg-background border border-border/50 text-[13px] rounded-md px-3 py-1.5 text-muted hover:text-foreground focus:outline-none focus:border-border transition-colors cursor-pointer shadow-sm">
          <option>Last 7 Days</option>
          <option>Last 30 Days</option>
        </select>
      </div>
      <div className="flex-1 w-full min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={movementData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis dataKey="name" stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} dy={10} />
            <YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} dx={-10} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#141414', borderColor: '#27272a', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              itemStyle={{ color: '#ededed' }}
              cursor={{fill: '#1f1f1f'}}
            />
            <Bar dataKey="in" fill="#ededed" radius={[4, 4, 0, 0]} name="Inbound" />
            <Bar dataKey="out" fill="#3f3f46" radius={[4, 4, 0, 0]} name="Outbound" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
