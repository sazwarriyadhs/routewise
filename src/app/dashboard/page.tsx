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
import { ReportGenerator } from '@/components/dashboard/report-generator';
import { GPSUploader } from '@/components/dashboard/gps-uploader';
import type { Coord } from '@/components/dashboard/simulated-vehicle';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { subDays, startOfDay, endOfDay } from 'date-fns';

const socket: Socket = io('http://localhost:3001');

const VehicleMap = dynamic(() => import('@/components/dashboard/vehicle-map'), {
  ssr: false,
  loading: () => <Skeleton className="h-[500px] w-full" />,
});

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [vehicles, setVehicles] = React.useState<Record<string, Vehicle>>({});
  const [selectedVehicleId, setSelectedVehicleId] = React.useState<string | null>(null);
  const [optimizedRoute, setOptimizedRoute] = React.useState<any | null>(null);
  const [isOptimizing, setIsOptimizing] = React.useState(false);
  const [initialLoadingError, setInitialLoadingError] = React.useState<string | null>(null);
  const [filteredRoutes, setFilteredRoutes] = React.useState<any[]>([]);
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });

  React.useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await fetch('/api/location');
        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(`Failed to fetch initial vehicle locations. Status: ${response.status}. Body: ${errorBody}`);
        }
        const initialVehicles: any[] = await response.json();

        if (initialVehicles.length === 0) {
          setInitialLoadingError("No vehicle data found. Please run the vehicle simulator to populate the database.");
          return;
        }

        const vehicleMap: Record<string, Vehicle> = {};
        initialVehicles.forEach(v => {
            vehicleMap[v.vehicle_id] = {
                id: v.vehicle_id,
                name: `Vehicle ${v.vehicle_id}`,
                latitude: v.latitude,
                longitude: v.longitude,
                speed: v.speed,
                status: v.status,
                type: 'Truck', // Default value
                heading: 0, // Default value
                fuelConsumption: 0, // Default value
                history: [], // Default value
            };
        });
        setVehicles(vehicleMap);
        if (initialVehicles.length > 0 && !selectedVehicleId) {
            setSelectedVehicleId(initialVehicles[0].vehicle_id);
        }
        setInitialLoadingError(null);
      } catch (error: any) {
        console.error("Failed to load initial data", error);
        setInitialLoadingError("Could not connect to the vehicle data service. Please ensure the vehicle simulator is running by executing `npm run simulate` in your terminal.");
        toast({
          title: "Error Loading Data",
          description: "Could not load initial vehicle data. Please start the simulator.",
          variant: "destructive"
        })
      }
    };
    
    fetchInitialData();

    socket.on('connect', () => console.log('Dashboard connected to socket server'));
    socket.on('location:update', (data: { vehicle_id: string, latitude: number, longitude: number, speed: number, status: Vehicle['status']}) => {
      setInitialLoadingError(null); // Clear error on first successful update
      setVehicles(prev => {
        const vehicle = prev[data.vehicle_id] || { id: data.vehicle_id, name: `Vehicle ${data.vehicle_id}` };
        const newHistory = [...(vehicle.history || []), [data.longitude, data.latitude]];
        return { 
          ...prev, 
          [data.vehicle_id]: { 
            ...vehicle, 
            latitude: data.latitude, 
            longitude: data.longitude,
            speed: data.speed,
            status: data.status,
            history: newHistory,
            type: vehicle.type || 'Truck',
            heading: vehicle.heading || 0,
            fuelConsumption: vehicle.fuelConsumption || 0,
            name: vehicle.name || `Vehicle ${data.vehicle_id}`,
          } 
        }
      });
    });

    return () => {
      socket.off('connect');
      socket.off('location:update');
      socket.disconnect();
    }
  }, [selectedVehicleId, toast]);
  
  React.useEffect(() => {
    const fetchFilteredRoutes = async () => {
        if (!dateRange?.from || !dateRange?.to) return;
        try {
            const fromISO = startOfDay(dateRange.from).toISOString();
            const toISO = endOfDay(dateRange.to).toISOString();
            const response = await fetch(`/api/reports/historical?startDate=${fromISO}&endDate=${toISO}`);
            if(!response.ok) {
                throw new Error("Failed to fetch filtered routes");
            }
            const data = await response.json();
            setFilteredRoutes(data);
        } catch(e) {
            console.error("Error fetching filtered routes", e);
            toast({
                title: "Error fetching routes",
                description: "Could not load filtered route data for the map.",
                variant: 'destructive'
            })
        }
    };
    fetchFilteredRoutes();
  }, [dateRange, toast])

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
        const job = optimizedRoute.jobs?.find((j: any) => j.id === step.job);
        const vehicle = activeVehicles.find(v => job && v.location[0] === job.location[0] && v.location[1] === job.location[1]);

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

  const handleGpsDataLoaded = () => {
      toast({
        title: "Simulation Started",
        description: "Vehicle data is being simulated and saved to the database.",
      });
  };

  return (
    <div className="flex h-screen w-full bg-muted/40 flex-col">
       <header className="flex h-16 items-center justify-between gap-4 border-b bg-background px-6 shrink-0">
          <div className="flex items-center gap-4">
            <Icons.Logo className="h-10 w-auto" />
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
        <main className="flex-1 grid grid-cols-1 md:grid-cols-[280px_1fr_350px] gap-4 p-4 overflow-hidden">
            <div className="h-full">
                 <VehicleList
                    vehicles={Object.values(vehicles)}
                    selectedVehicleId={selectedVehicleId}
                    onSelectVehicle={(vehicle) => setSelectedVehicleId(vehicle.id)}
                />
            </div>
            <div className="h-full rounded-xl border bg-card text-card-foreground shadow-sm relative overflow-hidden">
              {initialLoadingError ? (
                  <div className="flex h-full w-full items-center justify-center p-8">
                    <Alert variant="destructive">
                      <Terminal className="h-4 w-4" />
                      <AlertTitle>Action Required</AlertTitle>
                      <AlertDescription>
                        {initialLoadingError}
                        <code className="mt-4 block rounded bg-muted p-2 text-xs text-foreground">
                          npm run simulate
                        </code>
                      </AlertDescription>
                    </Alert>
                  </div>
                ) : (
                  <VehicleMap 
                    vehicles={Object.values(vehicles)}
                    routes={filteredRoutes}
                  />
              )}
            </div>
            <div className="h-full">
                <Tabs defaultValue="details" className="h-full flex flex-col">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="details">Vehicle Details</TabsTrigger>
                        <TabsTrigger value="optimizer">Route Optimizer</TabsTrigger>
                        <TabsTrigger value="reports">Reports</TabsTrigger>
                    </TabsList>
                    <TabsContent value="details" className="flex-grow overflow-y-auto p-1">
                        <VehicleDetails vehicle={selectedVehicle} />
                    </TabsContent>
                    <TabsContent value="optimizer" className="flex-grow overflow-y-auto p-1">
                        <RouteOptimizer 
                          onOptimize={handleOptimize}
                          isOptimizing={isOptimizing}
                          optimizedRoute={optimizedRoute}
                          onExport={handleExportPdf}
                        />
                    </TabsContent>
                    <TabsContent value="reports" className="flex-grow overflow-y-auto p-1 space-y-4">
                        <ReportGenerator date={dateRange} onDateChange={setDateRange} />
                        <GPSUploader onDataLoaded={handleGpsDataLoaded} />
                    </TabsContent>
                </Tabs>
            </div>
        </main>
    </div>
  );
}
