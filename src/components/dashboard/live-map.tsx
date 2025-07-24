'use client';

import * as React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import type { Vehicle } from '@/lib/types';
import L from 'leaflet';

// Fix for default icon issue with webpack
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LiveMapProps {
  vehicle: Vehicle | null;
}

const MapUpdater = ({ vehicle }: { vehicle: Vehicle | null }) => {
  const map = useMap();
  React.useEffect(() => {
    if (vehicle) {
      map.setView([vehicle.latitude, vehicle.longitude], map.getZoom());
    }
  }, [vehicle, map]);
  return null;
}

export default function LiveMap({ vehicle }: LiveMapProps) {
  const position: [number, number] = vehicle
    ? [vehicle.latitude, vehicle.longitude]
    : [34.0522, -118.2437]; // Default to LA if no vehicle

  return (
    <MapContainer
      center={position}
      zoom={14}
      scrollWheelZoom={false}
      style={{ height: '100%', width: '100%' }}
      whenCreated={() => {
        // This is a workaround for a bug in react-leaflet where the map is not properly sized on initial load.
        setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
        }, 200);
      }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapUpdater vehicle={vehicle} />
      {vehicle && (
        <Marker position={[vehicle.latitude, vehicle.longitude]}>
          <Popup>
            <b>{vehicle.name}</b>
            <br />
            Status: {vehicle.status}
            <br />
            Speed: {vehicle.speed} km/h
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
