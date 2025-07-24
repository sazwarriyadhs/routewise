
'use server';

/**
 * @fileOverview A dummy vehicle simulator that sends location updates via Socket.IO for multiple vehicles.
 */

import { io } from 'socket.io-client';
import type { Vehicle, VehicleMaster } from './types';
import { mockVehicles } from './mock-data';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

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

const API_BASE_URL = 'http://localhost:9003/api';

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
        // This may fail if the server is down, but we want the simulation to continue
        await axios.post(`${API_BASE_URL}/location`, payload).catch(() => {
            // console.warn(`Could not persist location for ${vehicle.id}, server may be down.`);
        });
        
        // The socket update is the most important part for the UI
        socket.emit('location:update', {...payload, status: vehicle.status, name: vehicle.name, type: vehicle.type });
        
        console.log(`📍 Sent ${vehicle.id}: (${vehicle.latitude.toFixed(4)}, ${vehicle.longitude.toFixed(4)}) Speed: ${vehicle.speed.toFixed(0)}km/h Status: ${vehicle.status}`);
    } catch (error: any) {
        console.error(`❌ Failed to send update for ${vehicle.id}:`, error.message);
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
    let masterVehicles: VehicleMaster[] = [];
    try {
        console.log('Initializing database schema...');
        await axios.post(`${API_BASE_URL}/db/init`);
        console.log('Database schema initialized.');

        console.log('Fetching vehicle list for simulation...');
        const response = await axios.get(`${API_BASE_URL}/vehicles`);
        masterVehicles = response.data;

    } catch(e: any) {
        console.error('❌ Simulator database connection failed:', e.message)
        console.warn('⚠️ Could not connect to the database. Falling back to mock vehicle data.');
        masterVehicles = mockVehicles.map(({id, name, type}) => ({id, name, type}));
    }

    if (masterVehicles.length === 0) {
        console.error('❌ No vehicles found in the database or mock data. Please add vehicles to start the simulation.');
        return;
    }

    vehicles = masterVehicles.map(v => ({
        ...v,
        latitude: -6.2 + (Math.random() - 0.5) * 0.2, // Start near Jakarta with some randomness
        longitude: 106.8 + (Math.random() - 0.5) * 0.2,
        speed: Math.random() * 60,
        heading: Math.random() * 360,
        status: 'Moving',
    }));

    console.log(`🚦 Loaded ${vehicles.length} vehicles. Starting simulation...`);
};

initializeSimulator();
