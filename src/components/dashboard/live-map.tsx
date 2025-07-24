'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM, Vector as VectorSource } from 'ol/source';
import { Point, LineString } from 'ol/geom';
import Feature from 'ol/Feature';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Style, Circle as CircleStyle, Fill, Stroke, Text, Icon } from 'ol/style';
import { io } from 'socket.io-client';
import 'ol/ol.css';

import { getRouteFromORS } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, MapPin, Route, Trash2, Loader2 } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';

interface VehicleLocation {
  id: string;
  latitude: number;
  longitude: number;
}

const socket = io('http://localhost:3001');

const LiveMap = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Map | null>(null);
  const vehicleVectorSource = useRef(new VectorSource());
  const routeVectorSource = useRef(new VectorSource());
  const waypointVectorSource = useRef(new VectorSource());

  const [vehicles, setVehicles] = useState<Record<string, VehicleLocation>>({});
  const [searchId, setSearchId] = useState('');
  const [waypoints, setWaypoints] = useState<number[][]>([]);
  const [totalDistance, setTotalDistance] = useState<number | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const { toast } = useToast();

  const handleMapClick = useCallback((event: any) => {
    const coords = toLonLat(event.coordinate);
    setWaypoints(prev => [...prev, coords]);
  }, []);

  const clearRoute = useCallback(() => {
    setWaypoints([]);
    routeVectorSource.current.clear();
    waypointVectorSource.current.clear();
    setTotalDistance(null);
  }, []);

  const handleOptimizeRoute = async () => {
    if (waypoints.length < 2) {
      toast({
        variant: 'destructive',
        title: 'Not enough points',
        description: 'Please select at least two points on the map.',
      });
      return;
    }
    setIsOptimizing(true);
    routeVectorSource.current.clear();
    const result = await getRouteFromORS(waypoints);

    if (result.success && result.data) {
      const { geometry, distance } = result.data;
      const routeCoords = geometry.map((coord: number[]) => fromLonLat(coord));
      const routeFeature = new Feature({
        geometry: new LineString(routeCoords),
      });
      routeFeature.setStyle(
        new Style({
          stroke: new Stroke({
            color: 'hsl(var(--primary))',
            width: 5,
          }),
        })
      );
      routeVectorSource.current.addFeature(routeFeature);
      setTotalDistance(distance);
      toast({
        title: 'Route Optimized!',
        description: `Total distance is ${distance.toFixed(2)} km.`,
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Optimization Failed',
        description: result.error,
      });
    }
    setIsOptimizing(false);
  };
  
  useEffect(() => {
    socket.on('connect', () => console.log('🛰️ Connected to socket server'));
    socket.on('location:update', (data: VehicleLocation) => {
      setVehicles(prev => ({ ...prev, [data.id]: data }));
    });
    return () => { socket.disconnect() };
  }, []);
  
  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
      mapInstance.current = new Map({
        target: mapRef.current,
        layers: [
          new TileLayer({ source: new OSM() }),
          new VectorLayer({ source: routeVectorSource.current }),
          new VectorLayer({ source: waypointVectorSource.current }),
          new VectorLayer({ source: vehicleVectorSource.current }),
        ],
        view: new View({
          center: fromLonLat([106.8456, -6.2088]), // Jakarta
          zoom: 10,
        }),
      });
      mapInstance.current.on('click', handleMapClick);
    }
    return () => mapInstance.current?.un('click', handleMapClick);
  }, [handleMapClick]);
  
  useEffect(() => {
    vehicleVectorSource.current.clear();
    Object.values(vehicles).forEach(vehicle => {
      const feature = new Feature({
        geometry: new Point(fromLonLat([vehicle.longitude, vehicle.latitude])),
        name: vehicle.id,
      });
      const style = new Style({
        image: new CircleStyle({
          radius: 7,
          fill: new Fill({ color: 'hsl(var(--accent))' }),
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
      vehicleVectorSource.current.addFeature(feature);
    });
  }, [vehicles]);

  useEffect(() => {
    waypointVectorSource.current.clear();
    waypoints.forEach((coord, index) => {
      const feature = new Feature({
        geometry: new Point(fromLonLat(coord)),
      });
      feature.setStyle(
        new Style({
          image: new CircleStyle({
            radius: 8,
            fill: new Fill({ color: `hsl(var(--primary))` }),
            stroke: new Stroke({ color: '#fff', width: 2 }),
          }),
          text: new Text({
            text: String.fromCharCode(65 + index), // A, B, C...
            font: 'bold 12px Inter, sans-serif',
            fill: new Fill({ color: '#fff' }),
          }),
        })
      );
      waypointVectorSource.current.addFeature(feature);
    });
  }, [waypoints]);

  useEffect(() => {
    if (!searchId || !mapInstance.current) return;
    const match = Object.values(vehicles).find(v => v.id.toLowerCase().includes(searchId.toLowerCase()));
    if (match) {
      const view = mapInstance.current.getView();
      view.animate({
        center: fromLonLat([match.longitude, match.latitude]),
        zoom: 16,
        duration: 1000,
      });
    }
  }, [searchId, vehicles]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-4 left-4 z-10 flex gap-2 flex-wrap">
        <form onSubmit={handleSearch} className="flex gap-2 items-center bg-background/80 p-2 rounded-lg shadow-md backdrop-blur-sm">
          <Input
            type="text"
            placeholder="Find Vehicle ID (e.g., TRUCK-001)"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="w-60"
          />
          {searchId && (
            <Button type="button" variant="ghost" size="icon" onClick={() => setSearchId('')} className="h-8 w-8">
              <X className="h-4 w-4" /> <span className="sr-only">Clear</span>
            </Button>
          )}
        </form>
        <Card className="bg-background/80 p-2 rounded-lg shadow-md backdrop-blur-sm">
          <CardContent className="p-0 flex gap-2 items-center">
            <Button onClick={handleOptimizeRoute} disabled={isOptimizing || waypoints.length < 2} className="h-10">
              {isOptimizing ? <Loader2 className="animate-spin" /> : <Route />}
              <span className="ml-2">Optimize Route</span>
            </Button>
            <Button onClick={clearRoute} variant="outline" size="icon" disabled={waypoints.length === 0} className="h-10 w-10">
              <Trash2 /> <span className="sr-only">Clear Route</span>
            </Button>
            {totalDistance !== null && (
              <Badge variant="secondary" className="text-base font-semibold py-2 px-3">
                {totalDistance.toFixed(2)} km
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="absolute bottom-4 left-4 z-10 bg-background/80 p-3 rounded-lg shadow-md backdrop-blur-sm">
         <div className='flex items-center gap-2'>
            <MapPin className="text-primary" />
            <p className="text-sm text-foreground">Click on the map to add waypoints</p>
         </div>
      </div>
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
};

export default LiveMap;
