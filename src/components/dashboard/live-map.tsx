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
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import { io } from 'socket.io-client';
import 'ol/ol.css';

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

  useEffect(() => {
    // No need to fetch, the socket server is separate.
    // The connection is established by creating the io() client.
    
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
      });
      feature.setStyle(new Style({
        image: new CircleStyle({
          radius: 7,
          fill: new Fill({ color: 'hsl(var(--primary))' }),
          stroke: new Stroke({ color: '#ffffff', width: 2 }),
        }),
      }));
      vectorSource.current.addFeature(feature);
    });
  }, [vehicles]);

  return <div ref={mapRef} className="w-full h-full" />;
};

export default LiveMap;
