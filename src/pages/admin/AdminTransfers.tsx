import React, { useState } from "react";
import { useAppStore, TransferStatus } from "@/store/useAppStore";
import { CheckCircle, UserPlus } from "lucide-react";

export default function AdminTransfers() {
  const transfers = useAppStore((state) => state.transfers);
  const approveTransfer = useAppStore((state) => state.approveTransfer);
  const assignWorker = useAppStore((state) => state.assignWorker);
  const updateTransferStatus = useAppStore((state) => state.updateTransferStatus);
  
  const getStatusColor = (status: TransferStatus) => {
    switch (status) {
      case "PENDING":
        return "bg-warning/15 text-warning border-warning/30";
      case "APPROVED":
        return "bg-info/15 text-info border-info/30";
      case "PICKED_UP":
        return "bg-brand-500/15 text-brand-500 border-brand-500/30";
      case "IN_TRANSIT":
        return "bg-purple-500/15 text-purple-500 border-purple-500/30";
      case "DELIVERED":
        return "bg-blue-500/15 text-blue-500 border-blue-500/30";
      case "VERIFIED":
      case "COMPLETED":
        return "bg-success/15 text-success border-success/30";
      case "DELAYED":
        return "bg-danger/15 text-danger border-danger/30";
      default:
        return "bg-zinc-800 text-zinc-400 border-zinc-700";
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Global Stock Transfers</h1>
        <p className="text-muted text-sm mt-1">Approve, dispatch, and assign personnel to warehouse-to-store stock transfers.</p>
      </div>

      <div className="bg-surface border border-border rounded-xl shadow-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-surface-hover/30 flex justify-between items-center">
          <h2 className="font-bold text-foreground">Operational Queue</h2>
          <span className="text-xs bg-brand-600 text-white font-mono font-bold px-2 py-0.5 rounded-full">{transfers.length} Total</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface-hover/10 text-xs font-bold text-muted uppercase tracking-wider">
                <th className="p-4">Transfer ID</th>
                <th className="p-4">Destination Store</th>
                <th className="p-4">Cartons</th>
                <th className="p-4">Assigned Driver</th>
                <th className="p-4">Status</th>
                <th className="p-4">Last Update</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {transfers.map((task) => (
                <tr key={task.id} className="hover:bg-surface-hover/20 transition-colors">
                  <td className="p-4 font-mono font-bold text-foreground">{task.id}</td>
                  <td className="p-4">{task.storeName} ({task.storeId})</td>
                  <td className="p-4 font-mono font-medium">{task.cartons}</td>
                  <td className="p-4 text-muted">
                    {task.workerName ? (
                      <span className="text-foreground font-medium">{task.workerName}</span>
                    ) : (
                      "Unassigned"
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="p-4 text-xs font-mono text-muted">{task.lastUpdate}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      {task.status === "PENDING" && (
                        <button
                          onClick={() => approveTransfer(task.id)}
                          className="bg-success-bg border border-success/30 hover:bg-success hover:text-white text-success px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Approve
                        </button>
                      )}
                      
                      {task.status === "APPROVED" && !task.workerId && (
                        <button
                          onClick={() => assignWorker(task.id, "W-402", "Alex M.")}
                          className="bg-brand-500/10 border border-brand-500/30 hover:bg-brand-600 hover:text-white text-brand-500 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center cursor-pointer"
                        >
                          <UserPlus className="w-3.5 h-3.5 mr-1.5" /> Assign Alex M.
                        </button>
                      )}

                      {task.status === "DELIVERED" && (
                        <button
                          onClick={() => updateTransferStatus(task.id, "COMPLETED")}
                          className="bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Verify & Complete
                        </button>
                      )}
                      
                      {task.status !== "PENDING" && task.status !== "APPROVED" && task.status !== "DELIVERED" && (
                        <span className="text-xs text-muted italic">In Progress</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
