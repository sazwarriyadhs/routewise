export type Vehicle = {
  id: string;
  name: string;
  type: 'Truck' | 'Van' | 'Car';
  latitude: number;
  longitude: number;
  speed: number; // in km/h
  heading: number; // in degrees
  fuelConsumption: number; // in L/100km
  status: 'Moving' | 'Idle' | 'Offline';
};

export type OptimizedRouteResult = {
  optimizedRoute: string;
  estimatedFuelSavings: number;
  reasoning: string;
};
