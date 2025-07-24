'use server';

/**
 * @fileOverview A dummy vehicle simulator that sends location updates via Socket.IO for multiple vehicles.
 */

import { io } from 'socket.io-client';
import { mockVehicles } from './mock-data';
import type { Vehicle } from './types';

const socket = io('http://localhost:3001');

const vehicles: Vehicle[] = JSON.parse(JSON.stringify(mockVehicles));

const updateVehicle = (vehicle: Vehicle): Vehicle => {
  if (vehicle.status === 'Offline') {
    return vehicle;
  }

  const newStatus = Math.random() < 0.1 ? (vehicle.status === 'Moving' ? 'Idle' : 'Moving') : vehicle.status;
  
  if (newStatus === 'Idle') {
    vehicle.speed = 0;
  } else {
    // Simulate movement
    const speedChange = (Math.random() - 0.5) * 10;
    vehicle.speed = Math.max(0, Math.min(100, vehicle.speed + speedChange));
    
    if (vehicle.speed > 0) {
      const headingChange = (Math.random() - 0.5) * 20;
      vehicle.heading = (vehicle.heading + headingChange + 360) % 360;

      const angleRad = (vehicle.heading * Math.PI) / 180;
      const distance = (vehicle.speed * 1000) / 3600 * 2; // m/s * 2s
      const latRad = (vehicle.latitude * Math.PI) / 180;
      const lonRad = (vehicle.longitude * Math.PI) / 180;

      const latChange = distance * Math.cos(angleRad) / 111111; // meters to degrees latitude
      const lonChange = distance * Math.sin(angleRad) / (111111 * Math.cos(latRad)); // meters to degrees longitude

      vehicle.latitude += latChange;
      vehicle.longitude += lonChange;

      vehicle.fuelConsumption = vehicle.type === 'Truck' ? 20 + (vehicle.speed/10) : 8 + (vehicle.speed/10);
    } else {
       vehicle.fuelConsumption = 0;
    }
  }

  vehicle.status = newStatus;
  return vehicle;
};

socket.on('connect', () => {
  console.log('🛰️  Simulator connected to server');

  setInterval(() => {
    vehicles.forEach(v => {
      const updatedVehicle = updateVehicle(v);
      if (updatedVehicle.status !== 'Offline') {
        socket.emit('location:update', updatedVehicle);
        console.log(`📍 Sent ${updatedVehicle.id}: (${updatedVehicle.latitude.toFixed(4)}, ${updatedVehicle.longitude.toFixed(4)}) Speed: ${updatedVehicle.speed.toFixed(0)}km/h`);
      }
    });
  }, 2000); 
});

socket.on('disconnect', () => {
  console.log('❌ Simulator disconnected from socket server');
});

console.log('🚦 Initializing multi-vehicle simulator...');
