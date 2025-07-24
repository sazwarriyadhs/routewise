'use client';

import { useState } from 'react';
import { useVehicles } from '@/hooks/useVehicles';
import type { Vehicle as VehicleType } from '@/hooks/useVehicles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// The hook returns the full vehicle object, but the form only needs to deal with the location data for this example.
// We'll create a simplified type for the form state.
type VehicleFormData = Omit<VehicleType, 'timestamp'> & { timestamp?: string };


export default function VehicleForm() {
  const { vehicles, addOrUpdateVehicle, deleteVehicle, loading, error } = useVehicles();
  const [form, setForm] = useState<VehicleFormData>({
    vehicle_id: '',
    latitude: 0,
    longitude: 0,
    speed: 0,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'vehicle_id' ? value : parseFloat(value) || 0,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vehicle_id) {
        alert("Vehicle ID is required.");
        return;
    }
    const vehicleData: VehicleType = {
        ...form,
        timestamp: new Date().toISOString()
    };
    await addOrUpdateVehicle(vehicleData);
    setForm({ vehicle_id: '', latitude: 0, longitude: 0, speed: 0 });
  };

  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      <h2 className="text-xl font-bold">Tambah / Update Kendaraan</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
        <Input name="vehicle_id" placeholder="Vehicle ID" value={form.vehicle_id} onChange={handleChange} required className="col-span-2" />
        <Input name="latitude" placeholder="Latitude" type="number" value={form.latitude} onChange={handleChange} />
        <Input name="longitude" placeholder="Longitude" type="number" value={form.longitude} onChange={handleChange} />
        <Input name="speed" placeholder="Speed (km/h)" type="number" value={form.speed} onChange={handleChange} />
        <Button type="submit" className="col-span-2">Simpan Kendaraan</Button>
      </form>

      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Daftar Kendaraan</h2>
        {loading && <p>Loading vehicles...</p>}
        {error && <p className="text-red-500">{error}</p>}
        <ul className="space-y-2">
          {vehicles.map((v) => (
            <li key={v.vehicle_id} className="flex justify-between items-center border p-2 rounded-md bg-card">
              <div>
                <strong className="font-semibold text-primary">{v.vehicle_id}</strong>
                <p className="text-sm text-muted-foreground">
                  Lat: {v.latitude.toFixed(4)}, Lon: {v.longitude.toFixed(4)}
                </p>
                 <p className="text-sm text-muted-foreground">
                    Speed: {v.speed} km/h
                </p>
              </div>
              <div className="flex gap-2">
                 <Button variant="outline" size="sm" onClick={() => setForm(v)}>Edit</Button>
                 <Button variant="destructive" size="sm" onClick={() => deleteVehicle(v.vehicle_id)}>Hapus</Button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
