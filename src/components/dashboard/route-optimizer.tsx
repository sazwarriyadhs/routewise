'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2, Zap } from 'lucide-react';
import type { Vehicle, OptimizedRouteResult } from '@/lib/types';
import { getOptimizedRoute } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

const routeOptimizerSchema = z.object({
  historicalRouteData: z.string().min(10, 'Please provide more detailed historical data.'),
  vehicleType: z.string(),
  currentRoute: z.string().min(5, 'Please enter a valid current route.'),
  trafficConditions: z.string().optional(),
  weatherConditions: z.string().optional(),
});

type RouteOptimizerFormValues = z.infer<typeof routeOptimizerSchema>;

interface RouteOptimizerProps {
  vehicle: Vehicle | null;
  onOptimizationResult: (result: OptimizedRouteResult | null) => void;
}

export function RouteOptimizer({ vehicle, onOptimizationResult }: RouteOptimizerProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<RouteOptimizerFormValues>({
    resolver: zodResolver(routeOptimizerSchema),
    defaultValues: {
      historicalRouteData: 'Avg speed 60km/h on I-5, heavy traffic near downtown, 2 stops. Fuel consumption spikes on hills near Griffith Park.',
      vehicleType: vehicle?.type || 'Truck',
      currentRoute: 'From Downtown LA to Santa Monica Pier',
      trafficConditions: 'Heavy',
      weatherConditions: 'Clear, 75°F',
    },
  });
  
  React.useEffect(() => {
    if (vehicle) {
      form.setValue('vehicleType', vehicle.type);
    }
  }, [vehicle, form]);

  const onSubmit = async (data: RouteOptimizerFormValues) => {
    setIsLoading(true);
    onOptimizationResult(null);

    const result = await getOptimizedRoute(data);

    if (result.success && result.data) {
      onOptimizationResult(result.data);
      toast({
        title: 'Route Optimized',
        description: 'AI has suggested a more fuel-efficient route.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Optimization Failed',
        description: result.error,
      });
    }
    setIsLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Route Optimizer</CardTitle>
        <CardDescription>
          Provide route details to get a fuel-efficient alternative.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="currentRoute"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Route</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., From Warehouse A to Port B" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="historicalRouteData"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Historical Data & Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., High traffic on 5th Ave during rush hour..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Include notes on traffic, speed, stops, etc.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="trafficConditions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Traffic</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Light, Moderate, Heavy" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="weatherConditions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weather</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Sunny, Rain, Snow" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Zap className="mr-2 h-4 w-4" />
              )}
              Optimize Route
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
