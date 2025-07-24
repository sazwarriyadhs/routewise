'use server';
/**
 * @fileOverview A flow to optimize a route using the OpenRouteService API.
 * 
 * - optimizeRoute - A function that takes vehicle locations and returns an optimized route.
 * - OptimizeRouteInput - The input type for the optimizeRoute function.
 * - OptimizeRouteOutput - The return type for the optimizeRoute function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const OptimizeRouteInputSchema = z.object({
    vehicles: z.array(z.object({
        id: z.string(),
        location: z.tuple([z.number(), z.number()]).describe("Longitude, Latitude"),
    })),
    startLocation: z.tuple([z.number(), z.number()]).describe("Starting Longitude, Latitude"),
});
export type OptimizeRouteInput = z.infer<typeof OptimizeRouteInputSchema>;

// We use z.any() here because the ORS API response is complex
export type OptimizeRouteOutput = z.infer<z.ZodAny>;

export async function optimizeRoute(input: OptimizeRouteInput): Promise<OptimizeRouteOutput> {
  return optimizeRouteFlow(input);
}

const optimizeRouteFlow = ai.defineFlow(
  {
    name: 'optimizeRouteFlow',
    inputSchema: OptimizeRouteInputSchema,
    outputSchema: z.any(),
  },
  async (input) => {
    const apiKey = process.env.ORS_API_KEY;
    if (!apiKey || apiKey === 'your-api-key-here') {
        // Instead of throwing, return a structured error object that the frontend can handle gracefully.
        return { 
            error: {
                code: 'API_KEY_MISSING',
                message: 'OpenRouteService API key is not configured. Please add it to your .env file.' 
            }
        };
    }
    
    const orsRequest = {
        jobs: input.vehicles.map((v, i) => ({
            id: i + 1,
            location: v.location,
        })),
        vehicles: [
          {
            id: 1,
            profile: 'driving-car',
            start: input.startLocation,
            capacity: [input.vehicles.length],
          },
        ],
      };

    const response = await fetch('https://api.openrouteservice.org/optimization', {
        method: 'POST',
        headers: {
            'Authorization': apiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
        },
        body: JSON.stringify(orsRequest),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("ORS API Error:", errorText);
        // Return a structured error for the frontend.
        return {
            error: {
                code: 'API_ERROR',
                message: `OpenRouteService API error: ${response.statusText}. Details: ${errorText}`
            }
        };
    }

    return await response.json();
  }
);
