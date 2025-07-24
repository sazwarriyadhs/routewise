
'use server';

/**
 * @fileOverview A dummy vehicle simulator that sends location updates via Socket.IO for multiple vehicles.
 */

import { io } from 'socket.io-client';
import type { VehicleMaster } from './types';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const socket = io('http://localhost:3001');

// This now represents a vehicle's state during simulation
interface SimulatedVehicle extends VehicleMaster {
    latitude: number;
    longitude: number;
    speed: number;
    heading: number;
    status: 'Moving' | 'Idle' | 'Offline';
}

let vehicles: SimulatedVehicle[] = [];

const API_BASE_URL = 'http://localhost:9002/api';

const updateVehicle = (vehicle: SimulatedVehicle): SimulatedVehicle => {
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
    }
  }

  vehicle.status = newStatus;
  return vehicle;
};

const sendLocationUpdate = async (vehicle: SimulatedVehicle) => {
    try {
        const payload = {
            vehicle_id: vehicle.id,
            latitude: vehicle.latitude,
            longitude: vehicle.longitude,
            speed: vehicle.speed,
        };
        await axios.post(`${API_BASE_URL}/location`, payload);
        
        // The socket now includes the status
        socket.emit('location:update', {...payload, status: vehicle.status });
        
        console.log(`📍 Sent ${vehicle.id}: (${vehicle.latitude.toFixed(4)}, ${vehicle.longitude.toFixed(4)}) Speed: ${vehicle.speed.toFixed(0)}km/h Status: ${vehicle.status}`);
    } catch (error: any) {
        console.error(`❌ Failed to send update for ${vehicle.id}:`, error.response?.data?.message || error.message);
    }
}


socket.on('connect', () => {
  console.log('🛰️  Simulator connected to server');

  setInterval(() => {
    if (vehicles.length === 0) return;
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


const initializeSimulator = async () => {
    try {
        console.log('Initializing database schema...');
        await axios.post(`${API_BASE_URL}/db/init`);
        console.log('Database schema initialized.');

        console.log('Fetching vehicle list for simulation...');
        const response = await axios.get(`${API_BASE_URL}/vehicles`);
        const masterVehicles: VehicleMaster[] = response.data;

        if (masterVehicles.length === 0) {
            console.warn('⚠️ No vehicles found in the database. Please add vehicles via the dashboard to start the simulation.');
            return;
        }

        vehicles = masterVehicles.map(v => ({
            ...v,
            latitude: -6.2, // Default start lat
            longitude: 106.8, // Default start lon
            speed: Math.random() * 60,
            heading: Math.random() * 360,
            status: 'Moving',
        }));

        console.log(`🚦 Loaded ${vehicles.length} vehicles. Starting simulation...`);

    } catch(e: any) {
        console.error('❌ Simulator initialization failed:', e.response?.data?.message || e.message)
        console.error('Please ensure the backend server is running and the database is accessible.');
    }
};

initializeSimulator();
