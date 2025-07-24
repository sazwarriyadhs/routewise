'use client';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Route, Fuel, Clock } from 'lucide-react';

interface RouteOptimizerProps {
    onOptimize: () => void;
    isOptimizing: boolean;
    optimizedRoute: any | null;
}

const ResultItem = ({ icon, label, value, unit }: { icon: React.ReactNode, label: string, value: string | number, unit?: string }) => (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="text-muted-foreground">{icon}</div>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="font-semibold">
        {value} <span className="text-xs text-muted-foreground">{unit}</span>
      </div>
    </div>
  );

export function RouteOptimizer({ onOptimize, isOptimizing, optimizedRoute }: RouteOptimizerProps) {
    const route = optimizedRoute?.routes?.[0];
    const summary = route?.summary;
  
    return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Route Optimizer</CardTitle>
        <CardDescription>
          Calculate the most efficient route for your active vehicles.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        {isOptimizing ? (
            <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p>Optimizing route...</p>
                </div>
            </div>
        ) : route && summary ? (
            <div className='space-y-4'>
                 <ResultItem 
                    icon={<Route className="h-5 w-5" />}
                    label="Total Distance"
                    value={(summary.distance / 1000).toFixed(2)}
                    unit="km"
                />
                 <ResultItem 
                    icon={<Clock className="h-5 w-5" />}
                    label="Total Duration"
                    value={(summary.duration / 60).toFixed(0)}
                    unit="minutes"
                />
                <ResultItem 
                    icon={<Fuel className="h-5 w-5" />}
                    label="Est. Fuel Savings"
                    value={(summary.distance / 1000 * 0.15).toFixed(2)} // Dummy calculation
                    unit="liters"
                />
            </div>
        ) : (
            <div className="flex h-48 items-center justify-center rounded-md border border-dashed">
                <p className="text-sm text-muted-foreground text-center">
                    Optimized route data will appear here.
                </p>
            </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={onOptimize} disabled={isOptimizing} className="w-full">
          {isOptimizing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Optimize Route
        </Button>
      </CardFooter>
    </Card>
  );
}
