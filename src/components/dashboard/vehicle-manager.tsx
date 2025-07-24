'use client';

import * as React from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, PlusCircle } from 'lucide-react';
import { VehicleForm } from './vehicle-form';

interface VehicleManagerProps {
    onVehicleUpdated: () => void;
}

export function VehicleManager({ onVehicleUpdated }: VehicleManagerProps) {
  const [isFormOpen, setIsFormOpen] = React.useState(false);

  return (
    <>
      <VehicleForm 
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmitted={() => {
            setIsFormOpen(false);
            onVehicleUpdated();
        }}
      />
      <Card>
        <CardHeader>
          <CardTitle>Manage Vehicles</CardTitle>
          <CardDescription>Add, edit, or remove vehicles from your fleet.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="flex h-32 items-center justify-center rounded-md border border-dashed">
             <Button variant="outline" onClick={() => setIsFormOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Vehicle
             </Button>
           </div>
        </CardContent>
        <CardFooter>
            <p className="text-xs text-muted-foreground">
                Edit or delete vehicles directly from the main vehicle list.
            </p>
        </CardFooter>
      </Card>
    </>
  );
}
