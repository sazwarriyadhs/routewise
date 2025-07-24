
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import type { Coord } from './simulated-vehicle';

interface GPSUploaderProps {
  onDataLoaded: (data: Coord[]) => void;
}

interface GPSLog {
    latitude: number;
    longitude: number;
    speed?: number;
    timestamp?: string;
    vehicle_id: string;
}

export function GPSUploader({ onDataLoaded }: GPSUploaderProps) {
  const [uploading, setUploading] = React.useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    toast({
        title: "File Upload Started",
        description: `Processing ${file.name}...`
    });

    const text = await file.text();
    const lines = text.trim().split('\n');
    const headers = lines[0].trim().split(',');
    const data: GPSLog[] = lines.slice(1).map((line) => {
        const values = line.split(',');
        const entry: any = {};
        headers.forEach((header, i) => {
            entry[header.trim()] = values[i];
        });
        return {
          vehicle_id: entry.vehicle_id,
          latitude: parseFloat(entry.latitude || entry.lat),
          longitude: parseFloat(entry.longitude || entry.lon),
          speed: parseInt(entry.speed, 10) || 0,
          timestamp: entry.timestamp || new Date().toISOString(),
        };
    }).filter(d => d.vehicle_id && !isNaN(d.latitude) && !isNaN(d.longitude));

    if (data.length === 0) {
        toast({
            title: "Upload Error",
            description: "No valid data rows found in the CSV file.",
            variant: "destructive"
        });
        setUploading(false);
        return;
    }

    onDataLoaded(data.map(d => ({ lat: d.latitude, lon: d.longitude })));
    
    // We already passed the data to the map for frontend simulation.
    // Now, let's also send it to the backend for persistence.
    try {
        const res = await fetch('/api/gps/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ logs: data }),
        });

        if (!res.ok) {
            const errorBody = await res.json();
            throw new Error(errorBody.message || 'Upload failed');
        }

        toast({
            title: "Upload Successful",
            description: `${data.length} logs from ${file.name} saved and simulation started.`,
        });

    } catch (err: any) {
         toast({
            title: "Backend Upload Failed",
            description: err.message || "Could not save data to the server.",
            variant: "destructive"
        });
    } finally {
        setUploading(false);
        if (e.target) e.target.value = '';
    }
  };

  return (
    <Card>
        <CardHeader>
            <CardTitle>GPS Simulation</CardTitle>
            <CardDescription>Upload a CSV file with `vehicle_id`, `lat`, and `lon` columns to save and simulate a path.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
                <Label htmlFor="gps-upload" className="sr-only">
                    Upload GPS File
                </Label>
                <Input
                    id="gps-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                    disabled={uploading}
                />
            </div>
             {uploading && (
                <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                   <Loader2 className="h-4 w-4 animate-spin" />
                   Processing and uploading file...
                </div>
            )}
        </CardContent>
    </Card>
  );
}
