'use client';

import * as React from 'react';
import { Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Vehicle } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import { Card } from '../ui/card';

interface VehicleListProps {
  vehicles: Vehicle[];
  selectedVehicleId: string | null;
  onSelectVehicle: (vehicle: Vehicle) => void;
  isCollapsed: boolean;
}

export function VehicleList({
  vehicles,
  selectedVehicleId,
  onSelectVehicle,
}: VehicleListProps) {

  const getStatusIndicatorColor = (status: Vehicle['status']) => {
    switch (status) {
      case 'Moving': return 'bg-green-500';
      case 'Idle': return 'bg-yellow-500';
      case 'Offline': return 'bg-slate-500';
      default: return 'bg-gray-500';
    }
  }

  return (
    <Card className="h-full flex flex-col">
       <div className="p-4 border-b">
         <h3 className="text-lg font-semibold text-foreground">
            Vehicles ({vehicles.length})
         </h3>
       </div>
        <ScrollArea className="flex-1">
            <div className="flex flex-col gap-1 p-2">
            {vehicles.map((vehicle) => (
                <Button
                key={vehicle.id}
                variant={selectedVehicleId === vehicle.id ? 'secondary' : 'ghost'}
                className='justify-start gap-3 relative h-12'
                onClick={() => onSelectVehicle(vehicle)}
                title={vehicle.name}
                >
                <div className="flex items-center gap-3">
                    <Truck className="h-5 w-5" />
                    <div className='text-left'>
                        <span className="font-semibold truncate">{vehicle.name}</span>
                        <p className='text-xs text-muted-foreground'>{vehicle.id}</p>
                    </div>
                </div>
                {vehicle.status !== 'Offline' && (
                    <span className={cn("absolute right-3 h-2.5 w-2.5 rounded-full", getStatusIndicatorColor(vehicle.status))}></span>
                )}
                </Button>
            ))}
            </div>
        </ScrollArea>
    </Card>
  );
}
