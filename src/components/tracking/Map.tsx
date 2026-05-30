"use client";

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAppStore } from '@/store/useAppStore';

// Custom icons to avoid default icon loading issues
const workerIcon = new L.DivIcon({
  className: 'custom-icon',
  html: `<div style="background-color: #3b82f6; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(59,130,246,0.8);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

const pickupIcon = new L.DivIcon({
  className: 'custom-icon',
  html: `<div style="background-color: #a855f7; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

const destIcon = new L.DivIcon({
  className: 'custom-icon',
  html: `<div style="background-color: #10b981; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

export default function Map({ taskId }: { taskId?: string }) {
  const activeTasks = useAppStore((state) => state.transfers);
  
  // If a taskId is provided, focus only on that task (Worker view), else show all (Manager/Admin view)
  const tasksToShow = taskId ? activeTasks.filter(t => t.id === taskId) : activeTasks;
  
  // Center roughly around India
  const center: [number, number] = tasksToShow.length > 0 ? tasksToShow[0].currentLocation : [22.9734, 78.6569];
  const zoom = taskId ? 13 : 5;

  // Dark theme map tiles (CartoDB Dark Matter)
  return (
    <MapContainer 
      center={center} 
      zoom={zoom} 
      style={{ height: '100%', width: '100%', zIndex: 10 }}
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      
      {tasksToShow.map((task) => (
        <div key={task.id}>
          {/* Route Line */}
          <Polyline 
            positions={task.route} 
            pathOptions={{ color: '#334155', weight: 4, opacity: 0.8, dashArray: "4 8" }} 
          />
          
          {/* Active Route Segment (up to current progress) */}
          <Polyline 
            positions={task.route.slice(0, task.routeProgressIndex + 1)} 
            pathOptions={{ color: '#3b82f6', weight: 4, opacity: 1 }} 
          />
          
          {/* Pickup Marker */}
          <Marker position={task.pickupLocation} icon={pickupIcon} />
          
          {/* Destination Marker */}
          <Marker position={task.destinationLocation} icon={destIcon} />
          
          {/* Current Live Worker Location */}
          <Marker position={task.currentLocation} icon={workerIcon}>
            <Popup className="dark-popup">
              <div className="text-xs font-sans">
                <div className="font-bold mb-1">{task.workerName}</div>
                <div>Status: <span className="font-semibold text-blue-500">{task.status}</span></div>
                <div>ETA: will reach in {task.eta} min</div>
              </div>
            </Popup>
          </Marker>
        </div>
      ))}
    </MapContainer>
  );
}
