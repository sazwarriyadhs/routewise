'use client';
import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Upload } from 'lucide-react';
import type { Coord } from './simulated-vehicle';
import Papa from 'papaparse';


interface GPSUploaderProps {
  onDataLoaded: (data: Coord[]) => void;
}

export function GPSUploader({ onDataLoaded }: GPSUploaderProps) {
  const [fileName, setFileName] = React.useState<string | null>(null);
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    
    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
            try {
                const coords = results.data as any[];
                const parsed: Coord[] = coords.map((row) => ({
                    lat: parseFloat(row.lat || row.latitude),
                    lon: parseFloat(row.lon || row.longitude),
                })).filter(c => !isNaN(c.lat) && !isNaN(c.lon));

                if (parsed.length === 0) {
                    throw new Error("CSV file is empty or does not contain valid 'lat'/'lon' columns.");
                }

                onDataLoaded(parsed);
                toast({
                    title: "File Loaded",
                    description: `${parsed.length} coordinates loaded from ${file.name}.`,
                })

            } catch(err: any) {
                toast({
                    title: "File Read Error",
                    description: err.message || "Could not parse the CSV file.",
                    variant: "destructive"
                })
                setFileName(null);
                if (e.target) e.target.value = '';
            }
        },
        error: (err: any) => {
            toast({
                title: "File Read Error",
                description: err.message || "An error occurred while parsing the CSV file.",
                variant: "destructive"
            });
            setFileName(null);
            if (e.target) e.target.value = '';
        }
    });
  };

  return (
    <Card>
        <CardHeader>
            <CardTitle>GPS Simulation</CardTitle>
            <CardDescription>Upload a CSV file with `lat` and `lon` columns to simulate a vehicle's path.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
            <Label htmlFor="gps-upload" className="flex items-center gap-2 cursor-pointer">
                <Upload className="h-4 w-4" />
                Upload GPS File (.csv)
            </Label>
            <Input
                id="gps-upload"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            />
            {fileName && <p className="mt-2 text-sm text-muted-foreground">Loaded: {fileName}</p>}
        </CardContent>
    </Card>
  );
}
