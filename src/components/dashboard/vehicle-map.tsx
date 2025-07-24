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

interface RouteLog {
    vehicle_id: string;
    latitude: number;
    longitude: number;
    timestamp: string;
}

interface VehicleMapProps {
    vehicles: Vehicle[];
    routes: RouteLog[];
    optimizedRoute: any;
}


export default function VehicleMap({ vehicles, routes, optimizedRoute }: VehicleMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [map, setMap] = useState<Map | null>(null);
  const [showRoutes, setShowRoutes] = useState(true);
  const routeLayersRef = useRef<VectorLayer<any>[]>([]);
  const vehicleLayerRef = useRef<VectorLayer<any> | null>(null);
  const optimizedRouteLayerRef = useRef<VectorLayer<any> | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const vehicleSource = new VectorSource();
    const vehicleLayer = new VectorLayer({ source: vehicleSource, zIndex: 10 });
    vehicleLayerRef.current = vehicleLayer;

    const optimizedRouteSource = new VectorSource();
    const optimizedRouteLayer = new VectorLayer({ source: optimizedRouteSource, zIndex: 5 });
    optimizedRouteLayerRef.current = optimizedRouteLayer;

    const initialMap = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        vehicleLayer,
        optimizedRouteLayer,
      ],
      view: new View({
        center: fromLonLat([106.816666, -6.2]),
        zoom: 10,
      }),
    });

    setMap(initialMap);

    return () => {
        initialMap.setTarget(undefined);
    };
  }, []);

  // Effect to update vehicle markers
  useEffect(() => {
      if (!map || !vehicleLayerRef.current) return;
      const source = vehicleLayerRef.current.getSource();
      if (!source) return;

      source.clear();

      vehicles.forEach(vehicle => {
          const marker = new Feature({
              geometry: new Point(fromLonLat([vehicle.longitude, vehicle.latitude]))
          });
          marker.setStyle(new Style({
              image: new Icon({
                  src: '/image/truck-icon.png',
                  scale: 0.5,
                  anchor: [0.5, 1],
              })
          }));
          source.addFeature(marker);
      })
  }, [vehicles, map])


  // Effect to draw/update historical routes
  useEffect(() => {
    if (!map) return;
    
    // Clear previous route layers
    routeLayersRef.current.forEach((layer) => map.removeLayer(layer));
    routeLayersRef.current = [];

    if (!showRoutes || !routes || routes.length === 0) {
      return;
    }
    
    const newRouteLayers: VectorLayer<any>[] = [];
    const colors = ["#FF0000", "#00AA00", "#0000FF", "#FF00FF", "#FF8800", "#444444"];
    
    const routesByVehicle = routes.reduce((acc, log) => {
        if (!acc[log.vehicle_id]) {
            acc[log.vehicle_id] = [];
        }
        acc[log.vehicle_id].push(fromLonLat([log.longitude, log.latitude]));
        return acc;
    }, {} as Record<string, number[][]>);


    Object.keys(routesByVehicle).forEach((vehicleId, index) => {
        const coordinates = routesByVehicle[vehicleId];
        if (coordinates.length < 2) return;

        const line = new LineString(coordinates);
        const feature = new Feature({ geometry: line });
        const routeLayer = new VectorLayer({
            source: new VectorSource({ features: [feature] }),
            style: new Style({
                stroke: new Stroke({ color: colors[index % colors.length], width: 3 }),
            }),
            zIndex: 1,
        });
        map.addLayer(routeLayer);
        newRouteLayers.push(routeLayer);
    });
    
    routeLayersRef.current = newRouteLayers;

  }, [showRoutes, routes, map]);

    // Effect to draw optimized route
    useEffect(() => {
        if (!map || !optimizedRouteLayerRef.current) return;
        const source = optimizedRouteLayerRef.current.getSource();
        source.clear();

        if (optimizedRoute && optimizedRoute.routes && optimizedRoute.routes.length > 0) {
            const route = optimizedRoute.routes[0];
            if (route.geometry) {
                 const coordinates = route.geometry.coordinates.map((coord: [number, number]) => fromLonLat(coord));
                 const line = new LineString(coordinates);
                 const feature = new Feature({ geometry: line });
                 feature.setStyle(new Style({
                    stroke: new Stroke({ color: 'hsl(var(--accent))', width: 6, lineDash: [8, 8] }),
                 }));
                 source.addFeature(feature);
                 map.getView().fit(line.getExtent(), { padding: [50, 50, 50, 50], duration: 1000 });
            }
        }
    }, [optimizedRoute, map])


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
