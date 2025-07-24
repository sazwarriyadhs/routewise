'use client';

import * as React from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { VehicleMaster } from '@/lib/types';

interface VehicleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle?: VehicleMaster | null;
  onSubmitted: () => void;
}

const formSchema = z.object({
  id: z.string().min(1, 'Vehicle ID is required').max(50),
  name: z.string().min(1, 'Vehicle name is required').max(100),
  type: z.enum(['Truck', 'Van', 'Car'], {
    required_error: 'Vehicle type is required',
  }),
});

export function VehicleForm({ open, onOpenChange, vehicle, onSubmitted }: VehicleFormProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: '',
      name: '',
      type: 'Truck',
    },
  });

  const {
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting },
  } = form;

  React.useEffect(() => {
    if (vehicle) {
      reset(vehicle);
    } else {
      reset({ id: '', name: '', type: 'Truck' });
    }
  }, [vehicle, reset, open]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const isEditing = !!vehicle;
    const url = isEditing ? `/api/vehicles/${vehicle.id}` : '/api/vehicles';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save vehicle');
      }

      toast({
        title: 'Success!',
        description: `Vehicle has been ${isEditing ? 'updated' : 'created'} successfully.`,
      });
      onSubmitted();
    } catch (error: any) {
      toast({
        title: 'An error occurred.',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{vehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</DialogTitle>
          <DialogDescription>
            {vehicle ? 'Update the details of your vehicle.' : 'Enter the details for the new vehicle.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
                <FormField
                    control={control}
                    name="id"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Vehicle ID</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="e.g., V006" disabled={!!vehicle}/>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Vehicle Name</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="e.g., Express Runner" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={control}
                    name="type"
                    render={({ field }) => (
                         <FormItem>
                            <FormLabel>Vehicle Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a vehicle type" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Truck">Truck</SelectItem>
                                    <SelectItem value="Van">Van</SelectItem>
                                    <SelectItem value="Car">Car</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Vehicle
                    </Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
