
'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SpeedChartProps {
  data: any[];
}

const SpeedChart = React.forwardRef<HTMLDivElement, SpeedChartProps>(({ data }, ref) => {
  const chartData = data.map((d) => ({
    time: format(new Date(d.timestamp), 'HH:mm'),
    speed: d.speed || 0,
  }));

  return (
    <div ref={ref} style={{ width: '700px', height: '350px', background: 'white', padding: '1rem' }}>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" fontSize={12} />
            <YAxis label={{ value: 'Speed (km/h)', angle: -90, position: 'insideLeft', fontSize: 12 }} fontSize={12} />
            <Tooltip
              contentStyle={{ fontSize: '12px', borderRadius: '0.5rem' }}
              labelStyle={{ fontWeight: 'bold' }}
            />
            <Area type="monotone" dataKey="speed" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" />
          </AreaChart>
        </ResponsiveContainer>
    </div>
  );
});

SpeedChart.displayName = 'SpeedChart';

export { SpeedChart };
