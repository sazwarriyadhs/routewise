'use client';
import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Upload } from 'lucide-react';

interface GPSUploaderProps {
  onDataLoaded: (data: any) => void;
}

export function GPSUploader({ onDataLoaded }: GPSUploaderProps) {
  const [fileName, setFileName] = React.useState<string | null>(null);
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (
          !Array.isArray(data) ||
          !data.every(
            (item) => typeof item === 'object' && 'lat' in item && 'lon' in item
          )
        ) {
          throw new Error(
            'Invalid file format. Must be an array of objects with "lat" and "lon" properties.'
          );
        }

        const transformedData = {
          coordinates: data.map((item) => [item.lon, item.lat]),
        };

        onDataLoaded(transformedData);
      } catch (err: any) {
        toast({
            title: "File Read Error",
            description: err.message || "Invalid GPS file format. Please use a valid JSON file.",
            variant: "destructive"
        })
        setFileName(null);
        e.target.value = '';
      }
    };

    reader.readAsText(file);
  };

  return (
    <Card>
        <CardHeader>
            <CardTitle>GPS Simulation</CardTitle>
            <CardDescription>Upload a JSON file with an array of coordinates to simulate a vehicle's path.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
            <Label htmlFor="gps-upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload GPS File (.json)
            </Label>
            <Input
                id="gps-upload"
                type="file"
                accept=".json"
                onChange={handleFileUpload}
            />
            {fileName && <p className="mt-2 text-sm text-green-600">Loaded: {fileName}</p>}
        </CardContent>
    </Card>
  );
}
