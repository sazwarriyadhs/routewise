'use client';
import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
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
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setUploading(true);
    
    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
            try {
                const logs = results.data as any[];
                const parsed: GPSLog[] = logs.map((row) => ({
                    latitude: parseFloat(row.lat || row.latitude),
                    longitude: parseFloat(row.lon || row.longitude),
                    speed: row.speed ? Number(row.speed) : 0,
                    timestamp: row.timestamp || new Date().toISOString(),
                    vehicle_id: row.vehicle_id || 'SIM-01', // Default vehicle id if not in csv
                })).filter(c => !isNaN(c.latitude) && !isNaN(c.longitude));

                if (parsed.length === 0) {
                    throw new Error("CSV file is empty or does not contain valid 'lat'/'lon' columns.");
                }

                // Send to backend
                const res = await fetch('/api/gps/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ logs: parsed }),
                });

                if (!res.ok) {
                    const errorBody = await res.json();
                    throw new Error(errorBody.message || 'Upload failed');
                }
                
                // For simulation on the frontend
                const coordsForSim: Coord[] = parsed.map(p => ({ lat: p.latitude, lon: p.longitude }));
                onDataLoaded(coordsForSim);
                
                toast({
                    title: "File Uploaded & Simulation Started",
                    description: `${parsed.length} GPS logs saved from ${file.name}.`,
                })

            } catch(err: any) {
                toast({
                    title: "Upload Error",
                    description: err.message || "Could not process or upload the file.",
                    variant: "destructive"
                })
                setFileName(null);
                if (e.target) e.target.value = '';
            } finally {
                setUploading(false);
            }
        },
        error: (err: any) => {
            toast({
                title: "File Read Error",
                description: err.message || "An error occurred while parsing the CSV file.",
                variant: "destructive"
            });
            setFileName(null);
            setUploading(false);
            if (e.target) e.target.value = '';
        }
    });
  };

  return (
    <Card>
        <CardHeader>
            <CardTitle>GPS Simulation</CardTitle>
            <CardDescription>Upload a CSV file with `lat` and `lon` columns to save and simulate a path.</CardDescription>
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
            {fileName && !uploading && <p className="mt-2 text-sm text-muted-foreground">Simulating path from: {fileName}</p>}
        </CardContent>
    </Card>
  );
}
