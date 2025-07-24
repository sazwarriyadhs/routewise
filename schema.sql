-- Drop existing tables to start fresh
DROP TABLE IF EXISTS vehicle_locations CASCADE;
DROP TABLE IF EXISTS gps_logs CASCADE;

-- Create the table for current vehicle locations
-- This table stores the last known location of each vehicle.
CREATE TABLE vehicle_locations (
  vehicle_id VARCHAR(255) PRIMARY KEY,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  speed INTEGER,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create the table for historical GPS logs
-- This table stores a complete history of location updates for all vehicles.
CREATE TABLE gps_logs (
  id SERIAL PRIMARY KEY,
  vehicle_id VARCHAR(255) NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  speed INTEGER,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);


-- Insert initial current locations from mock data into vehicle_locations
INSERT INTO vehicle_locations (vehicle_id, latitude, longitude, speed, timestamp) VALUES
('V001', 34.0522, -118.2437, 65, NOW() - interval '1 minute'),
('V002', 34.055, -118.25, 0, NOW() - interval '1 minute'),
('V003', 34.048, -118.245, 40, NOW() - interval '1 minute'),
('V004', 34.06, -118.26, 80, NOW() - interval '1 minute'),
('V005', 34.04, -118.23, 0, NOW() - interval '10 minutes'); -- Offline vehicle

-- Insert some historical log data for demonstration into gps_logs
-- Vehicle V001
INSERT INTO gps_logs (vehicle_id, latitude, longitude, speed, timestamp) VALUES
('V001', 34.0500, -118.2400, 60, NOW() - interval '10 minute'),
('V001', 34.0510, -118.2415, 62, NOW() - interval '5 minute'),
('V001', 34.0522, -118.2437, 65, NOW() - interval '1 minute');

-- Vehicle V002
INSERT INTO gps_logs (vehicle_id, latitude, longitude, speed, timestamp) VALUES
('V002', 34.0545, -118.2490, 20, NOW() - interval '10 minute'),
('V002', 34.0550, -118.2500, 0, NOW() - interval '5 minute'),
('V002', 34.055, -118.25, 0, NOW() - interval '1 minute');

-- Vehicle V003
INSERT INTO gps_logs (vehicle_id, latitude, longitude, speed, timestamp) VALUES
('V003', 34.045, -118.242, 35, NOW() - interval '10 minute'),
('V003', 34.047, -118.244, 38, NOW() - interval '5 minute'),
('V003', 34.048, -118.245, 40, NOW() - interval '1 minute');

-- Vehicle V004
INSERT INTO gps_logs (vehicle_id, latitude, longitude, speed, timestamp) VALUES
('V004', 34.058, -118.255, 75, NOW() - interval '10 minute'),
('V004', 34.059, -118.258, 78, NOW() - interval '5 minute'),
('V004', 34.06, -118.26, 80, NOW() - interval '1 minute');
