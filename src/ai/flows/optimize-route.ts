'use server';

/**
 * @fileOverview An AI agent that optimizes routes for fuel efficiency based on historical data.
 *
 * - optimizeRouteForFuelEfficiency - A function that suggests optimized routes for fuel efficiency.
 * - OptimizeRouteForFuelEfficiencyInput - The input type for the optimizeRouteForFuelEfficiency function.
 * - OptimizeRouteForFuelEfficiencyOutput - The return type for the optimizeRouteForFuelEfficiency function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OptimizeRouteForFuelEfficiencyInputSchema = z.object({
  historicalRouteData: z
    .string()
    .describe(
      'Historical route data including GPS coordinates, speed, fuel consumption, and timestamps.'
    ),
  vehicleType: z.string().describe('The type of vehicle (e.g., truck, van, car).'),
  currentRoute: z.string().describe('The current route the vehicle is taking.'),
  trafficConditions: z
    .string()
    .optional()
    .describe('Current traffic conditions on the route.'),
  weatherConditions: z
    .string()
    .optional()
    .describe('Current weather conditions on the route.'),
});
export type OptimizeRouteForFuelEfficiencyInput = z.infer<
  typeof OptimizeRouteForFuelEfficiencyInputSchema
>;

const OptimizeRouteForFuelEfficiencyOutputSchema = z.object({
  optimizedRoute: z
    .string()
    .describe('The optimized route for fuel efficiency.'),
  estimatedFuelSavings: z
    .number()
    .describe('The estimated fuel savings from using the optimized route.'),
  reasoning: z
    .string()
    .describe('The reasoning behind the optimized route suggestion.'),
});
export type OptimizeRouteForFuelEfficiencyOutput = z.infer<
  typeof OptimizeRouteForFuelEfficiencyOutputSchema
>;

export async function optimizeRouteForFuelEfficiency(
  input: OptimizeRouteForFuelEfficiencyInput
): Promise<OptimizeRouteForFuelEfficiencyOutput> {
  return optimizeRouteForFuelEfficiencyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'optimizeRouteForFuelEfficiencyPrompt',
  input: {schema: OptimizeRouteForFuelEfficiencyInputSchema},
  output: {schema: OptimizeRouteForFuelEfficiencyOutputSchema},
  prompt: `You are an AI route optimization expert specializing in fuel efficiency.

You will analyze historical route data, vehicle type, current route, traffic conditions, and weather conditions to suggest an optimized route for fuel efficiency.

Historical Route Data: {{{historicalRouteData}}}
Vehicle Type: {{{vehicleType}}}
Current Route: {{{currentRoute}}}
Traffic Conditions: {{{trafficConditions}}}
Weather Conditions: {{{weatherConditions}}}

Based on this information, provide an optimized route, estimated fuel savings, and the reasoning behind the suggestion.

Ensure that the optimized route takes into account factors such as:
- Minimizing distance
- Avoiding traffic congestion
- Utilizing routes with optimal speed limits for fuel efficiency
- Avoiding steep inclines
- Current weather conditions

Output the result in JSON format.
`, // Ensure output matches the schema
});

const optimizeRouteForFuelEfficiencyFlow = ai.defineFlow(
  {
    name: 'optimizeRouteForFuelEfficiencyFlow',
    inputSchema: OptimizeRouteForFuelEfficiencyInputSchema,
    outputSchema: OptimizeRouteForFuelEfficiencyOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
