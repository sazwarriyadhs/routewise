'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { LogOut, User, Zap } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { mockVehicles } from '@/lib/mock-data';
import type { Vehicle } from '@/lib/types';
import { VehicleDetails } from '@/components/dashboard/vehicle-details';
import { useToast } from '@/hooks/use-toast';
import { Icons } from '@/components/icons';
import { Skeleton } from '@/components/ui/skeleton';
import { VehicleList } from '@/components/dashboard/vehicle-list';
import { io, Socket } from 'socket.io-client';

const socket: Socket = io('http://localhost:3001');

const VehicleMap = dynamic(() => import('@/components/dashboard/vehicle-map'), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
});

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [vehicles, setVehicles] = React.useState<Record<string, Vehicle>>(() => {
    const initialVehicles: Record<string, Vehicle> = {};
    mockVehicles.forEach(v => initialVehicles[v.id] = v);
    return initialVehicles;
  });
  const [selectedVehicleId, setSelectedVehicleId] = React.useState<string>(
    mockVehicles[0].id
  );

  React.useEffect(() => {
    socket.on('connect', () => console.log('Dashboard connected to socket server'));
    socket.on('location:update', (data: Vehicle) => {
      setVehicles(prev => ({ ...prev, [data.id]: { ...(prev[data.id] || {}), ...data } }));
    });

    return () => {
      socket.off('connect');
      socket.off('location:update');
      socket.disconnect();
    }
  }, []);
  
  const selectedVehicle = selectedVehicleId ? vehicles[selectedVehicleId] : null;

  const handleLogout = () => {
    localStorage.removeItem('user_authenticated');
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
    router.replace('/');
  };

  return (
    <div className="flex h-screen w-full bg-muted/40 flex-col">
       <header className="flex h-16 items-center justify-between gap-4 border-b bg-background px-6 shrink-0">
          <div className="flex items-center gap-4">
            <Icons.Logo className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">
              RouteWise
            </h1>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 w-10 p-0 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src="https://placehold.co/40x40" alt="@user" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex-1 grid grid-cols-12 gap-4 p-4">
            <div className="col-span-2 h-full">
                 <VehicleList
                    vehicles={Object.values(vehicles)}
                    selectedVehicleId={selectedVehicleId}
                    onSelectVehicle={(vehicle) => setSelectedVehicleId(vehicle.id)}
                />
            </div>
            <div className="col-span-7 h-full rounded-xl border bg-card text-card-foreground shadow-sm relative overflow-hidden">
                <VehicleMap vehicle={selectedVehicle} />
            </div>
            <div className="col-span-3 h-full">
                <VehicleDetails vehicle={selectedVehicle} />
            </div>
        </main>
    </div>
  );
}
