'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { LogOut, User } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RouteOptimizer } from '@/components/dashboard/route-optimizer';
import { optimizeRoute } from '@/ai/flows/optimize-route-flow';
import jsPDF from 'jspdf';
import 'jspdf-autotable';


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
  const [optimizedRoute, setOptimizedRoute] = React.useState<any | null>(null);
  const [isOptimizing, setIsOptimizing] = React.useState(false);


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

  const handleOptimize = async () => {
    const activeVehicles = Object.values(vehicles).filter(v => v.status !== 'Offline');
    if (activeVehicles.length < 2) {
      toast({
        title: "Not enough vehicles",
        description: "Need at least 2 active vehicles to optimize a route.",
        variant: 'destructive',
      })
      return;
    }
    
    setIsOptimizing(true);
    setOptimizedRoute(null);
    try {
        const result = await optimizeRoute({
            vehicles: activeVehicles.map(v => ({
                id: v.id,
                location: [v.longitude, v.latitude],
            })),
            startLocation: [activeVehicles[0].longitude, activeVehicles[0].latitude],
        });
        setOptimizedRoute(result);
        toast({
            title: "Route Optimized",
            description: "The optimal route has been calculated and displayed on the map.",
        });
    } catch(e: any) {
        toast({
            title: "Optimization Failed",
            description: e.message || "Could not generate an optimized route.",
            variant: 'destructive',
        })
    } finally {
        setIsOptimizing(false);
    }
  }

  const handleExportPdf = () => {
    if (!optimizedRoute) return;

    const doc = new jsPDF();
    const route = optimizedRoute.routes?.[0];
    const summary = route?.summary;
    const activeVehicles = Object.values(vehicles).filter(v => v.status !== 'Offline');


    doc.setFontSize(18);
    doc.text('Optimized Route Report', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);

    doc.setFontSize(14);
    doc.text('Summary', 14, 40);

    const summaryData = [
        ['Total Vehicles', `${activeVehicles.length}`],
        ['Total Distance', `${(summary.distance / 1000).toFixed(2)} km`],
        ['Total Duration', `${(summary.duration / 60).toFixed(0)} minutes`],
        ['Est. Fuel Savings', `${(summary.distance / 1000 * 0.15).toFixed(2)} liters`],
    ];

    (doc as any).autoTable({
        startY: 45,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'striped',
    });

    doc.addPage();
    doc.setFontSize(14);
    doc.text('Route Details', 14, 22);
    
    const tableColumn = ["Order", "Vehicle ID", "Vehicle Name", "Stop Type"];
    const tableRows: any[][] = [];

    route.steps.forEach((step: any) => {
        const vehicle = step.type === 'start' || step.type === 'end' ? activeVehicles[0] : activeVehicles.find(v => v.id === optimizedRoute.jobs[step.job -1]?.description);

        const row = [
            step.id,
            vehicle?.id || 'N/A',
            vehicle?.name || 'Depot',
            step.type,
        ];
        tableRows.push(row);
    });

    (doc as any).autoTable({
        startY: 30,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
    });


    doc.save('route_optimization_report.pdf');
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
                <VehicleMap vehicle={selectedVehicle} optimizedRoute={optimizedRoute} />
            </div>
            <div className="col-span-3 h-full">
                <Tabs defaultValue="details" className="h-full flex flex-col">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="details">Vehicle Details</TabsTrigger>
                        <TabsTrigger value="optimizer">Route Optimizer</TabsTrigger>
                    </TabsList>
                    <TabsContent value="details" className="flex-grow">
                        <VehicleDetails vehicle={selectedVehicle} />
                    </TabsContent>
                    <TabsContent value="optimizer" className="flex-grow">
                        <RouteOptimizer 
                          onOptimize={handleOptimize}
                          isOptimizing={isOptimizing}
                          optimizedRoute={optimizedRoute}
                          onExport={handleExportPdf}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </main>
    </div>
  );
}
