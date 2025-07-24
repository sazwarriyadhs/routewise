'use server';

import {
  optimizeRouteForFuelEfficiency,
  type OptimizeRouteForFuelEfficiencyInput,
} from '@/ai/flows/optimize-route';
import axios from 'axios';

export async function getOptimizedRoute(
  data: OptimizeRouteForFuelEfficiencyInput
) {
  try {
    const result = await optimizeRouteForFuelEfficiency(data);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error optimizing route:', error);
    return {
      success: false,
      error: 'Failed to get an optimized route. Please try again.',
    };
  }
}

export async function getRouteFromORS(coordinates: number[][]) {
  if (!process.env.ORS_API_KEY) {
    return {
      success: false,
      error: 'OpenRouteService API key is not configured. Please add it to your .env file.',
    };
  }

  if (coordinates.length < 2) {
    return {
      success: false,
      error: 'Please select at least two points to calculate a route.',
    };
  }

  try {
    const response = await axios.post(
      'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
      {
        coordinates: coordinates,
      },
      {
        headers: {
          Authorization: process.env.ORS_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    const route = response.data.features[0];
    const geometry = route.geometry.coordinates;
    const distance = route.properties.summary.distance / 1000; // convert to km

    return { success: true, data: { geometry, distance } };
  } catch (error: any) {
    console.error('Error fetching route from ORS:', error.response?.data);
    const errorMessage =
      error.response?.data?.error?.message ||
      'Failed to get route from OpenRouteService.';
    return {
      success: false,
      error: errorMessage,
    };
  }
}
