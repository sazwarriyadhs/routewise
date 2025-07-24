'use server';

/**
 * @fileOverview A dummy vehicle simulator that sends location updates via Socket.IO.
 */

import { io } from 'socket.io-client';

// Dummy data awal: posisi Jakarta
const vehicle = { id: 'TRUCK-001', latitude: -6.2, longitude: 106.8 };


const socket = io('http://localhost:4000'); // Connect to our socket server on port 4000

socket.on('connect', () => {
  console.log('🛰️ Simulator connected to server');

  setInterval(() => {
    // Simulasi pergerakan acak
    vehicle.latitude += (Math.random() - 0.5) * 0.001;
    vehicle.longitude += (Math.random() - 0.5) * 0.001;

    socket.emit('location:update', vehicle);
    console.log(`📍 Sent ${vehicle.id}: (${vehicle.latitude.toFixed(5)}, ${vehicle.longitude.toFixed(5)})`);
  }, 2000); // Update every 2 seconds for a more fluid feel
});

socket.on('disconnect', () => {
  console.log('❌ Simulator disconnected from socket server');
});

console.log('🚦 Initializing vehicle simulator...');
