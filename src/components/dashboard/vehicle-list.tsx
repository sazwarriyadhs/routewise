'use client';

import * as React from 'react';
import { MoreHorizontal, Pencil, PlusCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Vehicle, VehicleMaster } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { VehicleForm } from './vehicle-form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

interface VehicleListProps {
  vehicles: Vehicle[];
  selectedVehicleId: string | null;
  onSelectVehicle: (vehicle: Vehicle) => void;
  onVehicleUpdated: () => void;
}

export function VehicleList({
  vehicles,
  selectedVehicleId,
  onSelectVehicle,
  onVehicleUpdated
}: VehicleListProps) {
  const { toast } = useToast();
  const [editingVehicle, setEditingVehicle] = React.useState<VehicleMaster | null>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);


  const getStatusIndicatorColor = (status: Vehicle['status']) => {
    switch (status) {
      case 'Moving': return 'bg-green-500';
      case 'Idle': return 'bg-yellow-500';
      case 'Offline': return 'bg-slate-500';
      default: return 'bg-gray-500';
    }
  }

  const handleAddNew = () => {
    setEditingVehicle(null);
    setIsFormOpen(true);
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle({id: vehicle.id, name: vehicle.name, type: vehicle.type});
    setIsFormOpen(true);
  };
  
  const handleDelete = async (vehicleId: string) => {
    try {
      const response = await fetch(`/api/vehicles/${vehicleId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete vehicle');
      }
      toast({
        title: 'Success',
        description: 'Vehicle deleted successfully.',
      });
      onVehicleUpdated();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };


  const handleFormSubmit = () => {
    setIsFormOpen(false);
    onVehicleUpdated();
  };

  return (
    <>
      <VehicleForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        vehicle={editingVehicle}
        onSubmitted={handleFormSubmit}
      />
      <Card className="h-full flex flex-col">
        <CardHeader className="p-4 border-b flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">
              Vehicles ({vehicles.length})
          </CardTitle>
          <Button size="sm" variant="outline" onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New
          </Button>
        </CardHeader>
        <CardContent className="p-0 flex-1">
          <ScrollArea className="h-full">
              <div className="flex flex-col gap-1 p-2">
              {vehicles.map((vehicle) => (
                  <div key={vehicle.id} className="group relative">
                    <Button
                    variant={selectedVehicleId === vehicle.id ? 'secondary' : 'ghost'}
                    className='justify-start gap-3 relative h-14 w-full pr-10'
                    onClick={() => onSelectVehicle(vehicle)}
                    title={vehicle.name}
                    >
                      <div className={cn("h-full w-1.5 rounded-l-md", getStatusIndicatorColor(vehicle.status))}></div>
                      <div className='text-left'>
                          <span className="font-semibold truncate">{vehicle.name}</span>
                          <p className='text-xs text-muted-foreground'>{vehicle.id}</p>
                      </div>
                    </Button>
                     <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(vehicle)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    <span>Edit</span>
                                </DropdownMenuItem>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                      <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                                      <span className="text-red-500">Delete</span>
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the vehicle
                                        and all its associated location data.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDelete(vehicle.id)} className="bg-destructive hover:bg-destructive/90">
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>

                            </DropdownMenuContent>
                        </DropdownMenu>
                     </div>
                  </div>
              ))}
              </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </>
  );
}
