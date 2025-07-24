'use client';

import React, { useEffect, useRef } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import { fromLonLat } from 'ol/proj';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { Feature } from 'ol';
import Point from 'ol/geom/Point';
import { Vector as VectorLayer } from 'ol/layer';
import VectorSource from 'ol/source/Vector';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import Overlay from 'ol/Overlay';
import type { Vehicle } from '@/lib/types';

interface VehicleMapProps {
  vehicle: Vehicle | null;
}

export default function VehicleMap({ vehicle }: VehicleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapObj = useRef<Map | null>(null);
  const markerLayer = useRef<VectorLayer<any> | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const popupOverlay = useRef<Overlay | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapObj.current) return;

    const baseLayer = new TileLayer({ source: new OSM() });
    const view = new View({
      center: fromLonLat([106.8272, -6.1754]), // Default to Jakarta
      zoom: 5,
    });

    mapObj.current = new Map({
      target: mapRef.current,
      layers: [baseLayer],
      view,
    });

    popupOverlay.current = new Overlay({
      element: popupRef.current!,
      positioning: 'bottom-center',
      stopEvent: false,
      offset: [0, -15],
    });
    mapObj.current.addOverlay(popupOverlay.current);

    markerLayer.current = new VectorLayer({
      source: new VectorSource(),
    });
    mapObj.current.addLayer(markerLayer.current);

    return () => mapObj.current?.setTarget(undefined);
  }, []);

  useEffect(() => {
    if (!vehicle || !markerLayer.current?.getSource() || !mapObj.current || !popupOverlay.current) {
        markerLayer.current?.getSource().clear();
        popupOverlay.current?.setPosition(undefined);
        return;
    };
    
    const lonLat = fromLonLat([vehicle.longitude, vehicle.latitude]);

    const iconFeature = new Feature({
      geometry: new Point(lonLat),
    });

    iconFeature.setStyle(
      new Style({
        image: new CircleStyle({
          radius: 8,
          fill: new Fill({ color: 'hsl(var(--primary))' }),
          stroke: new Stroke({ color: '#ffffff', width: 2 }),
        }),
      })
    );

    markerLayer.current.getSource().clear();
    markerLayer.current.getSource().addFeature(iconFeature);
    
    popupOverlay.current.setPosition(lonLat);
    if (popupRef.current) {
      popupRef.current.innerHTML = `<div class="bg-card text-card-foreground p-2 text-sm shadow rounded-md border border-border">
        <strong>${vehicle.name}</strong>
      </div>`;
    }

    mapObj.current.getView().animate({ center: lonLat, zoom: 14, duration: 600 });
  }, [vehicle]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      <div ref={popupRef} className="ol-popup absolute" />
    </div>
  );
}
