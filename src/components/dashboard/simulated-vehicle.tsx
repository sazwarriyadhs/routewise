'use client';

import { useEffect, useRef, useState } from 'react';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import { Vector as VectorLayer } from 'ol/layer';
import VectorSource from 'ol/source/Vector';
import { Style, Stroke, Icon } from 'ol/style';
import { fromLonLat } from 'ol/proj';
import { useMap } from '@/hooks/use-map'; 

export interface Coord {
  lat: number;
  lon: number;
}

interface SimulatedVehicleProps {
  gpsData: Coord[];
}

export default function SimulatedVehicle({ gpsData }: SimulatedVehicleProps) {
  const map = useMap();
  const [index, setIndex] = useState(0);
  const vectorRef = useRef<VectorLayer<any> | null>(null);

  useEffect(() => {
    if (!map || gpsData.length === 0) return;

    const points = gpsData.map((pt) => fromLonLat([pt.lon, pt.lat]));

    const vehicleFeature = new Feature({ geometry: new Point(points[0]) });
    vehicleFeature.setStyle(
      new Style({
        image: new Icon({
          src: 'https://openlayers.org/en/latest/examples/data/icon.png', // Using a placeholder icon
          scale: 0.5,
        }),
      })
    );

    const routeLine = new Feature({ geometry: new LineString(points) });
    routeLine.setStyle(
      new Style({
        stroke: new Stroke({
          color: 'hsl(var(--primary))',
          width: 4,
        }),
      })
    );

    const vectorSource = new VectorSource({ features: [vehicleFeature, routeLine] });
    const vectorLayer = new VectorLayer({ source: vectorSource });

    vectorRef.current = vectorLayer;
    map.addLayer(vectorLayer);
    map.getView().setCenter(points[0]);
    map.getView().setZoom(16);

    const interval = setInterval(() => {
      setIndex((prev) => {
        const nextIndex = prev + 1;
        if (nextIndex >= points.length) {
          clearInterval(interval);
          return prev;
        }
        vehicleFeature.setGeometry(new Point(points[nextIndex]));
        return nextIndex;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      if (vectorLayer) {
        map.removeLayer(vectorLayer);
      }
    };
  }, [map, gpsData]);

  return null;
}
