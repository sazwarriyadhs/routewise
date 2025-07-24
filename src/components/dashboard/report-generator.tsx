
"use client"

import * as React from "react"
import { format, subDays, startOfDay, endOfDay } from "date-fns"
import { Calendar as CalendarIcon, Download, Loader2 } from "lucide-react"
import { DateRange } from "react-day-picker"
import jsPDF from 'jspdf'
import 'jspdf-autotable'

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

export function ReportGenerator() {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  })
  const [isGenerating, setIsGenerating] = React.useState(false);
  const { toast } = useToast();

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
        
        const data = await response.json();

        if (data.length === 0) {
            toast({
                title: "No Data Available",
                description: "There is no vehicle data for the selected period.",
            });
            return;
        }
        
        generatePdf(data, date);

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

  const generatePdf = (data: any[], dateRange: DateRange) => {
    const doc = new jsPDF();
    const tableColumns = ["Vehicle ID", "Timestamp", "Latitude", "Longitude", "Speed (km/h)"];
    const tableRows: any[][] = [];

    data.forEach(log => {
        const row = [
            log.vehicle_id,
            format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss'),
            log.latitude.toFixed(6),
            log.longitude.toFixed(6),
            log.speed,
        ];
        tableRows.push(row);
    });

    doc.setFontSize(18);
    doc.text("Laporan Riwayat Perjalanan Kendaraan", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Period: ${format(dateRange.from!, "LLL dd, y")} to ${format(dateRange.to!, "LLL dd, y")}`, 14, 28)

    
    autoTable(doc, {
        head: [tableColumns],
        body: tableRows,
        startY: 35,
        theme: 'grid',
    });

    doc.save(`laporan-perjalanan_${format(new Date(), "yyyy-MM-dd")}.pdf`);
  }

  return (
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
                        onSelect={setDate}
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
  )
}
