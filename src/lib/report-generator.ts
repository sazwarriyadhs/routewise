import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { OptimizedRouteResult, Vehicle } from './types';

// A very simple fuel consumption model
const getFuelConsumptionRate = (vehicleType: Vehicle['type']): number => {
  switch (vehicleType) {
    case 'Truck':
      return 25 / 100; // L/km
    case 'Van':
      return 15 / 100; // L/km
    case 'Car':
      return 10 / 100; // L/km
    default:
      return 18 / 100; // L/km as a default
  }
};

export const generatePdfReport = (
  result: OptimizedRouteResult,
  vehicle: Vehicle,
) => {
  const doc = new jsPDF();
  const today = new Date();

  // Header
  doc.setFontSize(20);
  doc.text('Route Optimization Report', 14, 22);
  doc.setFontSize(12);
  doc.text(`Date: ${today.toLocaleDateString('en-US')}`, 14, 30);
  doc.text(`Vehicle: ${vehicle.name} (${vehicle.id})`, 14, 36);

  // Summary
  autoTable(doc, {
    startY: 45,
    head: [['Metric', 'Value']],
    body: [
        ['Suggested Route', result.optimizedRoute],
        ['Est. Fuel Savings (Liters)', `${result.estimatedFuelSavings.toFixed(2)}`],
    ],
    theme: 'striped',
  });
  
  // Reasoning
  const reasoningStartY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(14);
  doc.text('AI Reasoning', 14, reasoningStartY);
  doc.setFontSize(12);
  doc.text(result.reasoning, 14, reasoningStartY + 8, {
    maxWidth: 180,
  });

  // Save the PDF
  doc.save(`RouteWise_Report_${vehicle.id}_${today.toISOString().split('T')[0]}.pdf`);
};
