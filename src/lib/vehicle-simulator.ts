'use server';

/**
 * @fileOverview A dummy vehicle simulator that sends location updates via Socket.IO for multiple vehicles.
 */

import { io } from 'socket.io-client';
import { mockVehicles } from './mock-data';
import type { Vehicle } from './types';
import axios from 'axios';

const socket = io('http://localhost:3001');

const vehicles: Vehicle[] = JSON.parse(JSON.stringify(mockVehicles));

const API_BASE_URL = 'http://localhost:9002/api';


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
      
      const latChange = distance * Math.cos(angleRad) / 111320; // meters to degrees latitude
      const lonChange = distance * Math.sin(angleRad) / (111320 * Math.cos(latRad)); // meters to degrees longitude

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

const sendLocationUpdate = async (vehicle: Vehicle) => {
    try {
        await axios.post(`${API_BASE_URL}/location`, {
            vehicle_id: vehicle.id,
            latitude: vehicle.latitude,
            longitude: vehicle.longitude,
            speed: vehicle.speed
        });
        socket.emit('location:update', vehicle);
        console.log(`📍 Sent ${vehicle.id}: (${vehicle.latitude.toFixed(4)}, ${vehicle.longitude.toFixed(4)}) Speed: ${vehicle.speed.toFixed(0)}km/h`);
    } catch (error) {
        console.error(`❌ Failed to send update for ${vehicle.id}:`, (error as any).response?.data || (error as any).message);
    }
}


socket.on('connect', () => {
  console.log('🛰️  Simulator connected to server');

  setInterval(() => {
    vehicles.forEach(v => {
      const updatedVehicle = updateVehicle(v);
      if (updatedVehicle.status !== 'Offline') {
        sendLocationUpdate(updatedVehicle);
      }
    });
  }, 2000); 
});

socket.on('disconnect', () => {
  console.log('❌ Simulator disconnected from socket server');
});


console.log('🚦 Initializing multi-vehicle simulator...');
(async () => {
    try {
        console.log('Initializing database schema...');
        await axios.post(`${API_BASE_URL}/db/init`);
        console.log('Database schema initialized.');
    } catch(e) {
        // console.error('Could not initialize schema', (e as any).response?.data || (e as any).message)
    }
})();
