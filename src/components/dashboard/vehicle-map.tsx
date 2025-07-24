"use client";
import React, { useEffect, useRef, useState } from "react";
import Map from "ol/Map";
import View from "ol/View";
import { Tile as TileLayer, Vector as VectorLayer } from "ol/layer";
import { OSM } from "ol/source";
import { Vector as VectorSource } from "ol/source";
import { fromLonLat } from "ol/proj";
import { Feature } from "ol";
import { Point, LineString } from "ol/geom";
import { Icon, Stroke, Style } from "ol/style";
import { Button } from "@/components/ui/button";

interface Vehicle {
  id: string;
  latitude: number;
  longitude: number;
  speed: number;
  timestamp: string;
}

export default function VehicleMap({ vehicles }: { vehicles: Vehicle[] }) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [map, setMap] = useState<Map | null>(null);
  const [showRoutes, setShowRoutes] = useState(true);
  const [routeLayers, setRouteLayers] = useState<VectorLayer<any>[]>([]);

  useEffect(() => {
    if (!mapRef.current) return;

    const initialMap = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        center: fromLonLat([106.816666, -6.2]),
        zoom: 10,
      }),
    });

    setMap(initialMap);
    (window as any).map = initialMap;

    return () => {
        initialMap.setTarget(undefined)
        delete (window as any).map;
    };
  }, []);

  useEffect(() => {
    if (!map) return;
    
    // Clear previous route layers
    routeLayers.forEach((layer) => map.removeLayer(layer));
    setRouteLayers([]);

    if (!showRoutes) {
      return;
    }
    
    const newRouteLayers: VectorLayer<any>[] = [];

    const fetchAndAddRoute = async (vehicle: Vehicle, color: string) => {
      const res = await fetch(`/api/vehicles/logs?vehicle_id=${vehicle.id}`);
      const logs = await res.json();
      if (!logs || logs.length < 2) return;

      const coordinates = logs.map((p: any) => fromLonLat([p.longitude, p.latitude]));
      const line = new LineString(coordinates);
      const feature = new Feature({ geometry: line });
      const routeLayer = new VectorLayer({
        source: new VectorSource({ features: [feature] }),
        style: new Style({
          stroke: new Stroke({ color, width: 3 }),
        }),
      });

      map.addLayer(routeLayer);
      newRouteLayers.push(routeLayer);
    };

    const colors = ["#FF0000", "#00AA00", "#0000FF", "#FF00FF", "#FF8800"];
    vehicles.forEach((v, idx) => fetchAndAddRoute(v, colors[idx % colors.length]));
    
    setRouteLayers(newRouteLayers);

  }, [showRoutes, vehicles, map]);

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex gap-2 p-2 bg-card border-b">
        <Button variant="outline" size="sm" onClick={() => setShowRoutes(!showRoutes)}>
          {showRoutes ? "Sembunyikan Rute" : "Tampilkan Rute"}
        </Button>
      </div>
      <div ref={mapRef} className="w-full flex-grow rounded-b-xl shadow border" />
    </div>
  );
}

    