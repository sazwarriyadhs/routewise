'use client';

import { useEffect, useRef, useState } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM } from 'ol/source';
import VectorSource from 'ol/source/Vector';
import { Point } from 'ol/geom';
import Feature from 'ol/Feature';
import { fromLonLat } from 'ol/proj';
import { Style, Circle as CircleStyle, Fill, Stroke, Text } from 'ol/style';
import { io } from 'socket.io-client';
import 'ol/ol.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface VehicleLocation {
  id: string;
  latitude: number;
  longitude: number;
}

const socket = io('http://localhost:3001');

const LiveMap = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Map | null>(null);
  const vectorSource = useRef<VectorSource>(new VectorSource());
  const [vehicles, setVehicles] = useState<Record<string, VehicleLocation>>({});
  const [searchId, setSearchId] = useState('');

  useEffect(() => {
    socket.on('connect', () => {
      console.log('🛰️ Connected to socket server');
    });

    socket.on('location:update', (data: VehicleLocation) => {
      setVehicles((prev) => ({ ...prev, [data.id]: data }));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
      mapInstance.current = new Map({
        target: mapRef.current,
        layers: [
          new TileLayer({ source: new OSM() }),
          new VectorLayer({ source: vectorSource.current }),
        ],
        view: new View({
          center: fromLonLat([106.8456, -6.2088]), // Jakarta
          zoom: 10,
        }),
      });
    }

    // update features
    vectorSource.current.clear();

    Object.values(vehicles).forEach(vehicle => {
      const feature = new Feature({
        geometry: new Point(fromLonLat([vehicle.longitude, vehicle.latitude])),
        name: vehicle.id,
      });

      const style = new Style({
        image: new CircleStyle({
          radius: 7,
          fill: new Fill({ color: 'hsl(var(--primary))' }),
          stroke: new Stroke({ color: '#ffffff', width: 2 }),
        }),
        text: new Text({
          text: vehicle.id,
          font: '12px Inter, sans-serif',
          fill: new Fill({ color: 'hsl(var(--foreground))' }),
          stroke: new Stroke({ color: 'hsl(var(--background))', width: 3 }),
          offsetY: -20,
        }),
      });

      feature.setStyle(style);
      vectorSource.current.addFeature(feature);

      // Zoom if vehicle matches search
      if (searchId && vehicle.id.toLowerCase().includes(searchId.toLowerCase())) {
        const view = mapInstance.current?.getView();
        view?.animate({
          center: fromLonLat([vehicle.longitude, vehicle.latitude]),
          zoom: 16,
          duration: 1000,
        });
      }
    });
  }, [vehicles, searchId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // The search logic is already in the useEffect,
    // this function just prevents form submission.
  };

  return (
    <div className="relative w-full h-full">
       <form onSubmit={handleSearch} className="absolute top-4 left-4 z-10 flex gap-2 items-center bg-background/80 p-2 rounded-lg shadow-md backdrop-blur-sm">
        <Input
          type="text"
          placeholder="Find Vehicle ID (e.g., TRUCK-001)"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          className="w-64"
        />
        {searchId && (
           <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setSearchId('')}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Clear Search</span>
          </Button>
        )}
      </form>
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
};

export default LiveMap;
