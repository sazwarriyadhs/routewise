'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Loader2, UploadCloud } from 'lucide-react';
import type { Coord } from './simulated-vehicle';
import Papa from 'papaparse';
import { Button } from '../ui/button';

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
  const [fileName, setFileName] = React.useState('');
  const { toast } = useToast();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setFileName(file.name);
    toast({
        title: "File Upload Started",
        description: `Processing ${file.name}...`
    });

    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
            const data: GPSLog[] = (results.data as any[]).map((row) => ({
                vehicle_id: row.vehicle_id,
                latitude: parseFloat(row.latitude || row.lat),
                longitude: parseFloat(row.longitude || row.lon),
                speed: parseInt(row.speed, 10) || 0,
                timestamp: row.timestamp || new Date().toISOString(),
            })).filter(d => d.vehicle_id && !isNaN(d.latitude) && !isNaN(d.longitude));
            
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
            
            toast({
                title: "Frontend Simulation Started",
                description: "Vehicle is now moving along the uploaded path on the map.",
            });

            try {
                // Now send the data to the backend for persistence.
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
                    title: "Backend Upload Successful",
                    description: `${data.length} logs from ${file.name} have been saved to the database.`,
                });

            } catch (err: any) {
                 toast({
                    title: "Backend Upload Failed",
                    description: err.message || "Could not save data to the server.",
                    variant: "destructive"
                });
            } finally {
                setUploading(false);
                setFileName('');
                if (e.target) e.target.value = '';
            }
        },
        error: (error: any) => {
            toast({
                title: "Parsing Error",
                description: error.message || "Could not parse the CSV file.",
                variant: "destructive"
            });
            setUploading(false);
        }
    });
  };

  return (
    <Card>
        <CardHeader>
            <CardTitle>GPS Simulation</CardTitle>
            <CardDescription>Upload a CSV file with `vehicle_id`, `lat`/`latitude`, and `lon`/`longitude` columns to save and simulate a path.</CardDescription>
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
                   {fileName ? `Processing ${fileName}...` : 'Processing file...'}
                </div>
            )}
        </CardContent>
    </Card>
  );
}
