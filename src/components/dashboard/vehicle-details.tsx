'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Vehicle } from '@/lib/types';
import { Thermometer, Compass, Gauge, Droplets, Info } from 'lucide-react';

interface VehicleDetailsProps {
  vehicle: Vehicle | null;
}

const DetailItem = ({ icon, label, value, unit }: { icon: React.ReactNode, label: string, value: string | number | React.ReactNode, unit?: string }) => (
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

export function VehicleDetails({ vehicle }: VehicleDetailsProps) {
  if (!vehicle) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Vehicle Selected</CardTitle>
          <CardDescription>Please select a vehicle from the list to see its details.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-center justify-center rounded-md border border-dashed">
            <p className="text-sm text-muted-foreground">Vehicle data will appear here.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: Vehicle['status']) => {
    switch (status) {
      case 'Moving': return 'bg-green-500';
      case 'Idle': return 'bg-yellow-500';
      case 'Offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{vehicle.name}</CardTitle>
        <CardDescription>
          Live data feed for vehicle ID: {vehicle.id}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <DetailItem 
          icon={<Info className="h-5 w-5" />} 
          label="Status" 
          value={<Badge className={`${getStatusColor(vehicle.status)} hover:${getStatusColor(vehicle.status)}`}>{vehicle.status}</Badge>} 
        />
        <DetailItem 
          icon={<Gauge className="h-5 w-5" />} 
          label="Current Speed" 
          value={vehicle.speed} 
          unit="km/h" 
        />
        <DetailItem 
          icon={<Compass className="h-5 w-5" />} 
          label="Heading" 
          value={vehicle.heading} 
          unit="°" 
        />
        <DetailItem 
          icon={<Droplets className="h-5 w-5" />} 
          label="Fuel Consumption" 
          value={vehicle.fuelConsumption} 
          unit="L/100km" 
        />
        <DetailItem 
          icon={<Thermometer className="h-5 w-5" />} 
          label="Type" 
          value={vehicle.type} 
        />
      </CardContent>
    </Card>
  );
}
