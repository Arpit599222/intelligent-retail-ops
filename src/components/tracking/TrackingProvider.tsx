"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type TransferStatus = 
  | "Pending" | "Assigned" | "Heading to Pickup" | "Arrived at Pickup" 
  | "Loaded" | "In Transit" | "Reached Destination" | "Unloaded" 
  | "Verification Pending" | "Verified" | "Completed" | "Delayed";

export type Coordinate = [number, number];

export interface TransferTask {
  id: string;
  workerId: string;
  workerName: string;
  storeId: string;
  storeName: string;
  status: TransferStatus;
  pickupLocation: Coordinate;
  destinationLocation: Coordinate;
  currentLocation: Coordinate;
  route: Coordinate[];
  routeProgressIndex: number;
  eta: number; // in minutes
  cartons: number;
  lastUpdate: Date;
}

// LA Route approximation
const MOCK_ROUTE: Coordinate[] = [
  [34.0522, -118.2437],
  [34.0421, -118.2603],
  [34.0321, -118.2703],
  [34.0200, -118.2900],
  [34.0084, -118.3245],
  [33.9900, -118.3400],
  [33.9782, -118.3614],
  [33.9600, -118.3800],
  [33.9416, -118.4085]
];

const INITIAL_TASK: TransferTask = {
  id: "TRX-8821",
  workerId: "W-402",
  workerName: "Alex M.",
  storeId: "ST-003",
  storeName: "LA Mega",
  status: "Assigned",
  pickupLocation: MOCK_ROUTE[0],
  destinationLocation: MOCK_ROUTE[MOCK_ROUTE.length - 1],
  currentLocation: MOCK_ROUTE[0],
  route: MOCK_ROUTE,
  routeProgressIndex: 0,
  eta: 14,
  cartons: 42,
  lastUpdate: new Date(),
};

interface TrackingContextType {
  activeTasks: TransferTask[];
  updateTaskStatus: (taskId: string, newStatus: TransferStatus) => void;
  addActivityLog: (message: string) => void;
  activityLogs: { time: string, message: string }[];
}

const TrackingContext = createContext<TrackingContextType | undefined>(undefined);

export function TrackingProvider({ children }: { children: ReactNode }) {
  const [activeTasks, setActiveTasks] = useState<TransferTask[]>([INITIAL_TASK]);
  const [activityLogs, setActivityLogs] = useState<{time: string, message: string}[]>([]);

  const addActivityLog = (message: string) => {
    setActivityLogs(prev => [{ time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), message }, ...prev].slice(0, 50));
  };

  const updateTaskStatus = (taskId: string, newStatus: TransferStatus) => {
    setActiveTasks(prev => 
      prev.map(task => {
        if (task.id === taskId) {
          addActivityLog(`${task.workerName} updated ${task.id} to ${newStatus}`);
          return { ...task, status: newStatus, lastUpdate: new Date() };
        }
        return task;
      })
    );
  };

  // Real-time GPS Simulation Loop
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTasks(prevTasks => {
        return prevTasks.map(task => {
          // Only move if heading to pickup or in transit
          if (task.status === "Heading to Pickup" || task.status === "In Transit") {
            const isHeadingToPickup = task.status === "Heading to Pickup";
            const currentIdx = task.routeProgressIndex;
            
            // For demo: if heading to pickup, just wait at index 0 for 1 tick then arrive.
            // If in transit, move through the array.
            if (isHeadingToPickup) {
               addActivityLog(`${task.workerName} arrived at pickup point.`);
               return { ...task, status: "Arrived at Pickup", lastUpdate: new Date() };
            }

            if (task.status === "In Transit") {
               if (currentIdx < task.route.length - 1) {
                 const nextIdx = currentIdx + 1;
                 return { 
                   ...task, 
                   routeProgressIndex: nextIdx,
                   currentLocation: task.route[nextIdx],
                   eta: Math.max(1, task.eta - 1),
                   lastUpdate: new Date()
                 };
               } else {
                 addActivityLog(`${task.workerName} reached destination.`);
                 return { ...task, status: "Reached Destination", lastUpdate: new Date() };
               }
            }
          }
          return task;
        });
      });
    }, 5000); // Trigger a map update every 5 seconds for realism

    return () => clearInterval(interval);
  }, []);

  return (
    <TrackingContext.Provider value={{ activeTasks, updateTaskStatus, activityLogs, addActivityLog }}>
      {children}
    </TrackingContext.Provider>
  );
}

export function useTracking() {
  const context = useContext(TrackingContext);
  if (context === undefined) {
    throw new Error("useTracking must be used within a TrackingProvider");
  }
  return context;
}
