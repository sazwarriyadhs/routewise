export type VehicleType = 'Truck' | 'Van' | 'Car';

// Represents the master data for a vehicle
export type VehicleMaster = {
  id: string;
  name: string;
  type: VehicleType;
}

// Represents the full vehicle object with live data
export type Vehicle = VehicleMaster & {
  latitude: number;
  longitude: number;
  speed: number; // in km/h
  heading: number; // in degrees
  fuelConsumption: number; // in L/100km
  status: 'Moving' | 'Idle' | 'Offline';
  history: [number, number][];
};

export type OptimizedRouteResult = {
  optimizedRoute: string;
  estimatedFuelSavings: number;
  reasoning: string;
  totalDistance?: number; // Optional total distance in km
};
