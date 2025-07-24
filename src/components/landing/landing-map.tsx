"use client";
import React, { useEffect, useRef, useState } from "react";
import Map from "ol/Map";
import View from "ol/View";
import { Tile as TileLayer, Vector as VectorLayer } from "ol/layer";
import { OSM } from "ol/source";
import { Vector as VectorSource } from "ol/source";
import { fromLonLat } from "ol/proj";
import { Feature } from "ol";
import { Point } from "ol/geom";
import { Icon, Style } from "ol/style";
import { io, Socket } from 'socket.io-client';
import type { Vehicle } from '@/lib/types';
import 'ol/ol.css';

const socket: Socket = io('http://localhost:3001');

export default function LandingMap() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [map, setMap] = useState<Map | null>(null);
  const vehicleLayerRef = useRef<VectorLayer<any> | null>(null);
  const vehicleFeaturesRef = useRef<Record<string, Feature<Point>>>({});

  useEffect(() => {
    if (!mapRef.current) return;

    const vehicleSource = new VectorSource();
    const vehicleLayer = new VectorLayer({ 
        source: vehicleSource,
        zIndex: 10,
    });
    vehicleLayerRef.current = vehicleLayer;

    const initialMap = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        vehicleLayer,
      ],
      view: new View({
        center: fromLonLat([106.816666, -6.2]), // Jakarta
        zoom: 10,
      }),
      controls: [], // Remove default controls like zoom buttons
    });

    setMap(initialMap);

    const fetchInitialData = async () => {
        try {
            const response = await fetch('/api/location');
            if (response.ok) {
                const initialVehicles: Vehicle[] = await response.json();
                initialVehicles.forEach(updateVehicleMarker);
            }
        } catch (error) {
            console.error("Failed to fetch initial vehicle data for map", error);
        }
    };
    
    fetchInitialData();

    return () => {
        initialMap.setTarget(undefined);
    };
  }, []);

  // Socket listener effect
  useEffect(() => {
    socket.on('connect', () => console.log('Landing map connected to socket server'));
    socket.on('location:update', (data: Vehicle) => {
        updateVehicleMarker(data);
    });

    return () => {
      socket.off('connect');
      socket.off('location:update');
      socket.disconnect();
    }
  }, [map]);


  const updateVehicleMarker = (vehicle: Vehicle) => {
    if (!vehicleLayerRef.current) return;
    
    const source = vehicleLayerRef.current.getSource();
    if (!source) return;

    const coords = fromLonLat([vehicle.longitude, vehicle.latitude]);

    if (vehicleFeaturesRef.current[vehicle.id]) {
        // Update existing feature
        const feature = vehicleFeaturesRef.current[vehicle.id];
        feature.getGeometry()?.setCoordinates(coords);
    } else {
        // Create new feature
        const newFeature = new Feature({
            geometry: new Point(coords),
            name: vehicle.name,
        });

        newFeature.setStyle(new Style({
            image: new Icon({
                src: '/image/truck-icon.png',
                scale: 0.5,
                anchor: [0.5, 1],
            })
        }));
        
        source.addFeature(newFeature);
        vehicleFeaturesRef.current[vehicle.id] = newFeature;
    }
  }

  return (
    <div ref={mapRef} className="w-full h-full" />
  );
}
