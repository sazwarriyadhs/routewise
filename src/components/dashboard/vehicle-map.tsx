
'use client';

import { useEffect, useRef, useState } from 'react';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import { fromLonLat } from 'ol/proj';
import { Style, Stroke, Circle as CircleStyle, Fill } from 'ol/style';
import Overlay from 'ol/Overlay';
import 'ol/ol.css';
import type { Vehicle } from '@/lib/types';
import { MapContext } from '@/hooks/use-map';
import SimulatedVehicle, { type Coord } from './simulated-vehicle';


interface VehicleMapProps {
  vehicles: Vehicle[];
  selectedVehicleId: string | null;
  onSelectVehicle: (id: string) => void;
  showVehicleType: string[]; // filter by type (e.g. ["Truck"])
  simulatedGpsData: Coord[];
}

export default function VehicleMap({
  vehicles,
  selectedVehicleId,
  onSelectVehicle,
  showVehicleType,
  simulatedGpsData,
}: VehicleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<Map | null>(null);
  const markerLayerRef = useRef<VectorLayer<any>>(null);
  const routeLayerRef = useRef<VectorLayer<any>>(null);
  const selectedRouteLayerRef = useRef<VectorLayer<any>>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<Overlay | null>(null);

  useEffect(() => {
    if (mapRef.current && !map) {
      const markerLayer = new VectorLayer({
        source: new VectorSource(),
      });
      (markerLayerRef as React.MutableRefObject<any>).current = markerLayer;

      const routeLayer = new VectorLayer({
        source: new VectorSource(),
        style: new Style({
          stroke: new Stroke({
            color: 'hsl(var(--accent))',
            width: 3,
          }),
        }),
      });
      (routeLayerRef as React.MutableRefObject<any>).current = routeLayer;
      
      const selectedRouteLayer = new VectorLayer({
        source: new VectorSource(),
        style: new Style({
          stroke: new Stroke({
            color: 'hsl(var(--primary))',
            width: 5,
          }),
        }),
      });
      (selectedRouteLayerRef as React.MutableRefObject<any>).current = selectedRouteLayer;


      const olMap = new Map({
        target: mapRef.current,
        layers: [
          new TileLayer({ source: new OSM() }),
          routeLayer,
          selectedRouteLayer,
          markerLayer,
        ],
        view: new View({
          center: fromLonLat([106.8272, -6.1754]), // Jakarta default
          zoom: 12,
        }),
      });

      const overlay = new Overlay({
        element: popupRef.current!,
        autoPan: true,
        positioning: 'bottom-center',
        offset: [0, -20],
      });
      olMap.addOverlay(overlay);
      (overlayRef as React.MutableRefObject<any>).current = overlay;

      setMap(olMap);

      return () => olMap.setTarget(undefined);
    }
  }, [map]);

  useEffect(() => {
    if (!map || !markerLayerRef.current || !routeLayerRef.current) return;

    // Do not render live vehicles if a simulation is active
    if(simulatedGpsData.length > 0) {
      markerLayerRef.current.getSource().clear();
      routeLayerRef.current.getSource().clear();
      overlayRef.current?.setPosition(undefined);
      return;
    }

    const markerSource = markerLayerRef.current.getSource();
    const routeSource = routeLayerRef.current.getSource();
    markerSource.clear();
    routeSource.clear();

    vehicles.forEach((vehicle) => {
      if (!showVehicleType.includes(vehicle.type)) return;

      const coord = fromLonLat([vehicle.longitude, vehicle.latitude]);

      const marker = new Feature({
        geometry: new Point(coord),
        vehicle,
      });
      marker.setStyle(
        new Style({
            image: new CircleStyle({
                radius: 8,
                fill: new Fill({ color: vehicle.id === selectedVehicleId ? 'hsl(var(--primary))' : 'hsl(var(--accent))' }),
                stroke: new Stroke({ color: '#ffffff', width: 2 }),
            }),
        })
      );
      markerSource.addFeature(marker);

      if(vehicle.history && vehicle.history.length > 1) {
        const routeLine = new Feature({
            geometry: new LineString(vehicle.history.map(fromLonLat)),
        });
        routeSource.addFeature(routeLine);
      }
    });

    const clickHandler = (evt: any) => {
      let featureFound = false;
      map.forEachFeatureAtPixel(evt.pixel, (feature) => {
        const vehicle = feature.get('vehicle');
        if (vehicle) {
          featureFound = true;
          onSelectVehicle(vehicle.id);
          const coord = fromLonLat([vehicle.longitude, vehicle.latitude]);
          overlayRef.current?.setPosition(coord);
          if (popupRef.current)
            popupRef.current.innerHTML = `
              <div class="bg-card text-card-foreground p-2 text-sm shadow rounded-md border border-border">
                <strong>${vehicle.name}</strong><br/>
                Status: ${vehicle.status}<br/>
                Speed: ${vehicle.speed} km/h
              </div>
            `;
        }
      });
      if (!featureFound) {
        overlayRef.current?.setPosition(undefined);
      }
    };
    
    map.on('singleclick', clickHandler);

    return () => {
        map.un('singleclick', clickHandler)
    }

  }, [vehicles, map, showVehicleType, selectedVehicleId, onSelectVehicle, simulatedGpsData]);

  useEffect(() => {
    if (!map || simulatedGpsData.length > 0) {
        overlayRef.current?.setPosition(undefined);
        return;
    };

    const selectedRouteSource = selectedRouteLayerRef.current?.getSource();
    if (!selectedRouteSource) return;
    
    selectedRouteSource.clear();
    
    if (!selectedVehicleId) {
        return;
    }

    const fetchRoute = async () => {
      try {
        const res = await fetch(`/api/vehicles/logs?vehicle_id=${selectedVehicleId}`);
        const data = await res.json();
        if (data && data.length > 1) {
          const path = data.map((log: any) => fromLonLat([log.longitude, log.latitude]));
          const routeLine = new Feature({
            geometry: new LineString(path),
          });
          selectedRouteSource.addFeature(routeLine);
        }
      } catch (err) {
        console.error('Failed to load vehicle route:', err);
      }
    };
    fetchRoute();


    const selected = vehicles.find((v) => v.id === selectedVehicleId);
    if (selected) {
      map.getView().animate({ center: fromLonLat([selected.longitude, selected.latitude]), duration: 500, zoom: 15 });
    }
  }, [selectedVehicleId, vehicles, map, simulatedGpsData]);

  return (
    <div className="w-full h-full relative">
      <MapContext.Provider value={map}>
        <div ref={mapRef} className="w-full h-full" />
        <div ref={popupRef} className="ol-popup" />
        {simulatedGpsData.length > 0 && <SimulatedVehicle gpsData={simulatedGpsData} />}
      </MapContext.Provider>
    </div>
  );
}
