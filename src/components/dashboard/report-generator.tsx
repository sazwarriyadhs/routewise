
"use client"

import * as React from "react"
import { format, startOfDay, endOfDay } from "date-fns"
import { Calendar as CalendarIcon, Download, Loader2 } from "lucide-react"
import { DateRange } from "react-day-picker"
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import html2canvas from 'html2canvas'

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"
import { SpeedChart } from "./speed-chart"

interface ReportGeneratorProps {
    date: DateRange | undefined;
    onDateChange: (date: DateRange | undefined) => void;
}

interface GPSLog {
  vehicle_id: string;
  latitude: number;
  longitude: number;
  speed: number;
  timestamp: string;
}

// Helper function to calculate distance between two lat/lon points (Haversine formula)
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calculateTotalDistance(points: GPSLog[]): number {
    if (points.length < 2) return 0;
    let total = 0;
    for (let i = 1; i < points.length; i++) {
        total += haversine(
            points[i - 1].latitude,
            points[i - 1].longitude,
            points[i].latitude,
            points[i].longitude
        );
    }
    return total;
}


export function ReportGenerator({ date, onDateChange }: ReportGeneratorProps) {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const { toast } = useToast();
  const [chartData, setChartData] = React.useState<GPSLog[]>([]);
  const chartRef = React.useRef<HTMLDivElement>(null);


  const handleGenerateReport = async () => {
    if (!date?.from || !date?.to) {
        toast({
            title: "Date range required",
            description: "Please select a start and end date for the report.",
            variant: "destructive"
        });
        return;
    }

    setIsGenerating(true);
    try {
        const fromISO = startOfDay(date.from).toISOString();
        const toISO = endOfDay(date.to).toISOString();

        const response = await fetch(`/api/reports/historical?startDate=${fromISO}&endDate=${toISO}`);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to fetch report data.");
        }
        
        const data: GPSLog[] = await response.json();

        if (data.length === 0) {
            toast({
                title: "No Data Available",
                description: "There is no vehicle data for the selected period.",
            });
            return;
        }
        
        await generatePdf(data, date);

    } catch (e: any) {
        toast({
            title: "Report Generation Failed",
            description: e.message || "An unexpected error occurred.",
            variant: "destructive"
        });
    } finally {
        setIsGenerating(false);
    }
  }

  const generatePdf = async (data: GPSLog[], dateRange: DateRange) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    
    const logsByVehicle = data.reduce((acc, log) => {
        if (!acc[log.vehicle_id]) {
            acc[log.vehicle_id] = [];
        }
        acc[log.vehicle_id].push(log);
        return acc;
    }, {} as Record<string, GPSLog[]>);

    let isFirstPage = true;

    for (const vehicleId in logsByVehicle) {
        if (!isFirstPage) {
            doc.addPage();
        }
        
        doc.setFontSize(18);
        doc.text("Vehicle Trip History Report", 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Period: ${format(dateRange.from!, "LLL dd, y")} to ${format(dateRange.to!, "LLL dd, y")}`, 14, 28)

        const vehicleLogs = logsByVehicle[vehicleId];
        const totalDistance = calculateTotalDistance(vehicleLogs);
        const movingLogs = vehicleLogs.filter(l => l.speed > 0);
        const totalSpeed = movingLogs.reduce((sum, log) => sum + (log.speed || 0), 0);
        const avgSpeed = movingLogs.length > 0 ? (totalSpeed / movingLogs.length) : 0;

        doc.setFontSize(14);
        doc.text(`Vehicle ID: ${vehicleId}`, 14, 40);
        
        const summaryData = [
            ['Total Distance', `${totalDistance.toFixed(2)} km`],
            ['Average Speed (Moving)', `${avgSpeed.toFixed(2)} km/h`],
            ['Total Records', `${vehicleLogs.length}`]
        ];

        (doc as any).autoTable({
            startY: 45,
            head: [['Metric', 'Value']],
            body: summaryData,
            theme: 'striped',
            headStyles: { fontSize: 10 },
            bodyStyles: { fontSize: 9 },
        });

        let lastY = (doc as any).lastAutoTable.finalY + 10;
        
        // Render chart off-screen, capture it, and add to PDF
        setChartData(vehicleLogs);
        await new Promise(resolve => setTimeout(resolve, 100)); // Allow chart to render
        
        if (chartRef.current) {
            const canvas = await html2canvas(chartRef.current, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const imgProps = doc.getImageProperties(imgData);
            const pdfWidth = doc.internal.pageSize.getWidth() - 28;
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            doc.setFontSize(12);
            doc.text("Speed Profile", 14, lastY);
            lastY += 5;
            doc.addImage(imgData, 'PNG', 14, lastY, pdfWidth, pdfHeight);
            lastY += pdfHeight + 10;
        }
        setChartData([]); // Clear chart data

        const tableColumns = ["Timestamp", "Latitude", "Longitude", "Speed (km/h)"];
        const tableRows: any[][] = [];

        vehicleLogs.forEach(log => {
            const row = [
                format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss'),
                log.latitude.toFixed(6),
                log.longitude.toFixed(6),
                log.speed,
            ];
            tableRows.push(row);
        });

        (doc as any).autoTable({
            head: [tableColumns],
            body: tableRows,
            startY: lastY,
            theme: 'grid',
            headStyles: { fontSize: 8 },
            bodyStyles: { fontSize: 8 },
        });

        isFirstPage = false;
    }


    doc.save(`report-perjalanan_${format(new Date(), "yyyy-MM-dd")}.pdf`);
  }

  return (
    <>
      <div style={{ position: 'fixed', left: '-2000px', top: 0 }}>
        <SpeedChart data={chartData} ref={chartRef} />
      </div>
      <Card className="h-full flex flex-col">
          <CardHeader>
              <CardTitle>Report Generator</CardTitle>
              <CardDescription>
              Export historical vehicle location data for a selected date range.
              </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow space-y-4">
              <div className={cn("grid gap-2")}>
                  <Popover>
                      <PopoverTrigger asChild>
                      <Button
                          id="date"
                          variant={"outline"}
                          className={cn(
                          "w-full justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                          )}
                      >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date?.from ? (
                          date.to ? (
                              <>
                              {format(date.from, "LLL dd, y")} -{" "}
                              {format(date.to, "LLL dd, y")}
                              </>
                          ) : (
                              format(date.from, "LLL dd, y")
                          )
                          ) : (
                          <span>Pick a date</span>
                          )}
                      </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                          initialFocus
                          mode="range"
                          defaultMonth={date?.from}
                          selected={date}
                          onSelect={onDateChange}
                          numberOfMonths={2}
                      />
                      </PopoverContent>
                  </Popover>
              </div>
              <div className="flex h-32 items-center justify-center rounded-md border border-dashed">
                  <p className="text-sm text-muted-foreground text-center">
                      Select a date range and click generate to download the report.
                  </p>
              </div>
          </CardContent>
          <CardFooter>
              <Button 
                  className="w-full" 
                  onClick={handleGenerateReport}
                  disabled={isGenerating}
              >
                  {isGenerating ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                  ) : (
                      <><Download className="mr-2 h-4 w-4" /> Generate Report</>
                  )}
              </Button>
          </CardFooter>
      </Card>
    </>
  )
}
