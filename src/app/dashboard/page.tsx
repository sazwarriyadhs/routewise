'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { LogOut, User, Zap } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockVehicles } from '@/lib/mock-data';
import type { Vehicle, OptimizedRouteResult } from '@/lib/types';
import { RouteOptimizer } from '@/components/dashboard/route-optimizer';
import { VehicleDetails } from '@/components/dashboard/vehicle-details';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { Skeleton } from '@/components/ui/skeleton';
import { generatePdfReport } from '@/lib/report-generator';
import { VehicleList } from '@/components/dashboard/vehicle-list';
import { io, Socket } from 'socket.io-client';

const socket: Socket = io('http://localhost:3001');

const LiveMap = dynamic(() => import('@/components/dashboard/live-map'), {
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
  const [selectedVehicleId, setSelectedVehicleId] = React.useState<string | null>(
    mockVehicles[0].id
  );
  const [optimizationResult, setOptimizationResult] =
    React.useState<OptimizedRouteResult | null>(null);

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

  const handleGenerateReport = () => {
    if (optimizationResult && selectedVehicle) {
      generatePdfReport(optimizationResult, selectedVehicle);
      toast({
        title: 'Report Generated',
        description: 'The PDF report has been downloaded.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Cannot Generate Report',
        description: 'Please optimize a route and select a vehicle first.',
      });
    }
  };

  return (
    <div className="flex h-screen w-full bg-muted/40 flex-col">
       <header className="flex h-16 items-center justify-between gap-4 border-b bg-background px-6 shrink-0">
          <div className="flex items-center gap-4">
            <Icons.Logo className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">
              Real-time Route Optimization
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
                    isCollapsed={false}
                />
            </div>
            <div className="col-span-7 h-full rounded-xl border bg-card text-card-foreground shadow-sm relative overflow-hidden">
                <LiveMap />
            </div>
            <div className="col-span-3 h-full">
                 <Tabs defaultValue="details" className="h-full flex flex-col">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="details">Vehicle Details</TabsTrigger>
                        <TabsTrigger value="optimize">
                        <Zap className="mr-2 h-4 w-4" /> AI Optimize
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="details" className="flex-1">
                        <VehicleDetails vehicle={selectedVehicle} />
                    </TabsContent>
                    <TabsContent value="optimize" className="flex-1">
                        <RouteOptimizer
                        vehicle={selectedVehicle}
                        onOptimizationResult={setOptimizationResult}
                        />
                        {optimizationResult && (
                        <Card className="mt-4">
                            <CardHeader>
                            <CardTitle>Optimization Complete</CardTitle>
                            <CardDescription>AI-powered route suggestion.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                            <div>
                                <h4 className="font-semibold">Suggested Route</h4>
                                <p className="text-muted-foreground">{optimizationResult.optimizedRoute}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold">Est. Fuel Savings</h4>
                                <Badge variant="secondary">{optimizationResult.estimatedFuelSavings.toFixed(2)} Liters</Badge>
                            </div>
                            <div>
                                <h4 className="font-semibold">Reasoning</h4>
                                <p className="text-muted-foreground">{optimizationResult.reasoning}</p>
                            </div>
                            <Button onClick={handleGenerateReport} className="w-full mt-4">
                                Generate PDF Report
                            </Button>
                            </CardContent>
                        </Card>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </main>
    </div>
  );
}
