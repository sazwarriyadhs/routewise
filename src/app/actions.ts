'use server';

import {
  optimizeRouteForFuelEfficiency,
  type OptimizeRouteForFuelEfficiencyInput,
} from '@/ai/flows/optimize-route';

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
