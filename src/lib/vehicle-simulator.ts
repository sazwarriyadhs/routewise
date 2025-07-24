'use server';

/**
 * @fileOverview A dummy vehicle simulator that sends location updates via Socket.IO.
 */

import { io } from 'socket.io-client';
import { mockVehicles } from './mock-data';
import type { Vehicle } from './types';

const socket = io('http://localhost:3001');

const vehicles: Vehicle[] = JSON.parse(JSON.stringify(mockVehicles)); // Deep copy

socket.on('connect', () => {
  console.log('✅ Simulator connected to socket server');
  console.log('🚀 Starting vehicle simulation...');
  
  // Start simulation for all vehicles
  vehicles.forEach(vehicle => {
    if (vehicle.status !== 'Offline') {
      setInterval(() => {
        simulateMovement(vehicle);
        // Use the vehicle id as the unique identifier for the location update
        socket.emit('location:update', {
          id: vehicle.id,
          latitude: vehicle.latitude,
          longitude: vehicle.longitude,
        });
      }, 2000 + Math.random() * 2000); // Update every 2-4 seconds
    }
  });
});

socket.on('disconnect', () => {
  console.log('❌ Simulator disconnected from socket server');
});

function simulateMovement(vehicle: Vehicle) {
  const latChange = (Math.random() - 0.5) * 0.001; // Small random change
  const lonChange = (Math.random() - 0.5) * 0.001;

  vehicle.latitude += latChange;
  vehicle.longitude += lonChange;

  // Keep within a reasonable bounding box around the initial area
  const initial = mockVehicles.find(v => v.id === vehicle.id);
  if (initial) {
      if (Math.abs(vehicle.latitude - initial.latitude) > 0.1) vehicle.latitude = initial.latitude;
      if (Math.abs(vehicle.longitude - initial.longitude) > 0.1) vehicle.longitude = initial.longitude;
  }
}

console.log('🚦 Initializing vehicle simulator...');
