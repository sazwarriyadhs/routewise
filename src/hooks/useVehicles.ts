'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';
import type { Vehicle, VehicleMaster } from '@/lib/types';


export function useVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      // This endpoint returns the full vehicle list with live status
      const res = await fetch('/api/location');
      if (!res.ok) {
        const errorBody = await res.json();
        throw new Error(errorBody.message || 'Failed to fetch vehicles');
      }
      const data = await res.json();
      setVehicles(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error fetching vehicles",
        description: err.message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const addVehicle = async (vehicle: Omit<VehicleMaster, 'id'> & { id?: string }) => {
    const res = await fetch('/api/vehicles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vehicle),
    });
     if (!res.ok) {
        const errorBody = await res.json();
        throw new Error(errorBody.message || 'Failed to add vehicle');
     }
    await fetchVehicles(); // Refresh list
  };

  const updateVehicle = async (id: string, vehicle: Omit<VehicleMaster, 'id'>) => {
    const res = await fetch(`/api/vehicles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vehicle),
    });
    if (!res.ok) {
        const errorBody = await res.json();
        throw new Error(errorBody.message || 'Failed to update vehicle');
    }
    await fetchVehicles(); // Refresh list
  }

  const deleteVehicle = async (id: string) => {
    const res = await fetch(`/api/vehicles/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
        const errorBody = await res.json();
        throw new Error(errorBody.message || 'Failed to delete vehicle');
    }
    await fetchVehicles(); // Refresh list
  };

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  return { vehicles, loading, error, addVehicle, updateVehicle, deleteVehicle, refetch: fetchVehicles };
}
