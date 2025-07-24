'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  Map,
  Truck,
  User,
  Zap,
} from 'lucide-react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockVehicles } from '@/lib/mock-data';
import type { Vehicle, OptimizedRouteResult } from '@/lib/types';
import { RouteOptimizer } from '@/components/dashboard/route-optimizer';
import { VehicleDetails } from '@/components/dashboard/vehicle-details';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { Skeleton } from '@/components/ui/skeleton';

const LiveMap = dynamic(() => import('@/components/dashboard/live-map'), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
});

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [vehicles, setVehicles] = React.useState<Vehicle[]>(mockVehicles);
  const [selectedVehicle, setSelectedVehicle] = React.useState<Vehicle | null>(
    mockVehicles[0]
  );
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const [optimizationResult, setOptimizationResult] =
    React.useState<OptimizedRouteResult | null>(null);

  const handleLogout = () => {
    localStorage.removeItem('user_authenticated');
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
    router.replace('/');
  };

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <aside
        className={cn(
          'flex h-screen flex-col border-r bg-background transition-all',
          isSidebarCollapsed ? 'w-16' : 'w-72'
        )}
      >
        <div className="flex h-16 items-center border-b px-4 shrink-0">
          <div className="flex items-center gap-2 font-semibold">
            <Icons.Logo className="h-6 w-6 text-primary" />
            {!isSidebarCollapsed && <span>RouteWise</span>}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto h-8 w-8"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          >
            {isSidebarCollapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <nav className="flex flex-col gap-1 p-2">
            <h3 className={cn("px-2 py-2 text-xs font-medium text-muted-foreground", isSidebarCollapsed && "hidden")}>
              Vehicles
            </h3>
            {vehicles.map((vehicle) => (
              <Button
                key={vehicle.id}
                variant={selectedVehicle?.id === vehicle.id ? 'secondary' : 'ghost'}
                className={cn(
                  'justify-start gap-2',
                  isSidebarCollapsed && 'h-10 w-10 justify-center p-0'
                )}
                onClick={() => setSelectedVehicle(vehicle)}
                title={vehicle.name}
              >
                <Truck className="h-4 w-4" />
                {!isSidebarCollapsed && <span className="truncate">{vehicle.name}</span>}
              </Button>
            ))}
          </nav>
        </ScrollArea>
        <div className="mt-auto border-t p-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className={cn("w-full justify-start gap-2", isSidebarCollapsed && 'h-10 w-10 justify-center p-0')}>
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://placehold.co/40x40" alt="@user" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                {!isSidebarCollapsed && (
                  <div className="text-left">
                    <p className="text-sm font-medium">Demo User</p>
                    <p className="text-xs text-muted-foreground">admin@prowess.com</p>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start">
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
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center gap-4 border-b bg-background px-6">
          <h1 className="text-xl font-semibold">
           Real-time Route Optimization
          </h1>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:flex-row md:gap-8">
          <div className="flex-1 rounded-xl border bg-card text-card-foreground shadow-sm relative overflow-hidden">
            <LiveMap />
          </div>
          <div className="w-full md:w-[400px] lg:w-[450px]">
            <Tabs defaultValue="details" className="h-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Vehicle Details</TabsTrigger>
                <TabsTrigger value="optimize">
                  <Zap className="mr-2 h-4 w-4" /> AI Optimize
                </TabsTrigger>
              </TabsList>
              <TabsContent value="details">
                <VehicleDetails vehicle={selectedVehicle} />
              </TabsContent>
              <TabsContent value="optimize">
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
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
