'use client';

import * as React from 'react';
import { Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Vehicle } from '@/lib/types';
import { cn } from '@/lib/utils';

interface VehicleListProps {
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  onSelectVehicle: (vehicle: Vehicle) => void;
  isCollapsed: boolean;
}

export function VehicleList({
  vehicles,
  selectedVehicle,
  onSelectVehicle,
  isCollapsed,
}: VehicleListProps) {
  return (
    <nav className="flex flex-col gap-1 p-2">
      <h3
        className={cn(
          'px-2 py-2 text-xs font-medium text-muted-foreground',
          isCollapsed && 'hidden'
        )}
      >
        Vehicles
      </h3>
      {vehicles.map((vehicle) => (
        <Button
          key={vehicle.id}
          variant={selectedVehicle?.id === vehicle.id ? 'secondary' : 'ghost'}
          className={cn(
            'justify-start gap-2',
            isCollapsed && 'h-10 w-10 justify-center p-0'
          )}
          onClick={() => onSelectVehicle(vehicle)}
          title={vehicle.name}
        >
          <Truck className="h-4 w-4" />
          {!isCollapsed && <span className="truncate">{vehicle.name}</span>}
        </Button>
      ))}
    </nav>
  );
}
