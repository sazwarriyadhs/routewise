'use client';

import * as React from 'react';
import { Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Vehicle } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';

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
  isCollapsed,
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
    <nav className="flex flex-col gap-1 p-2">
      <h3
        className={cn(
          'px-2 py-2 text-xs font-medium text-muted-foreground',
          isCollapsed && 'hidden'
        )}
      >
        Vehicles ({vehicles.length})
      </h3>
      {vehicles.map((vehicle) => (
        <Button
          key={vehicle.id}
          variant={selectedVehicleId === vehicle.id ? 'secondary' : 'ghost'}
          className={cn(
            'justify-start gap-3 relative',
            isCollapsed && 'h-10 w-10 justify-center p-0'
          )}
          onClick={() => onSelectVehicle(vehicle)}
          title={vehicle.name}
        >
          <div className="flex items-center gap-3">
             <Truck className="h-4 w-4" />
             {!isCollapsed && <span className="truncate">{vehicle.name}</span>}
          </div>
          {!isCollapsed && vehicle.status !== 'Offline' && (
             <span className={cn("absolute right-2 h-2 w-2 rounded-full", getStatusIndicatorColor(vehicle.status))}></span>
          )}
        </Button>
      ))}
    </nav>
  );
}
