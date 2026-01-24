"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar as CalendarIcon,
  PartyPopper,
  BookOpen,
  CalendarDays,
  Cloud,
  Droplets,
  Wind,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { addDays } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface CalendarEvent {
  _Date: string;
  _Title: string;
  _DayType: "Holiday" | "Assignment" | "Regular";
  _StartTime: string;
  _Icon?: string;
  _DGU?: string;
  _AddLinkData?: string;
  _Link?: string;
  _EvtDescription?: string;
}

interface CalendarData {
  CalendarListing: {
    EventLists: {
      EventList: CalendarEvent[];
    };
    _SchoolBegDate: string;
    _SchoolEndDate: string;
    _MonthBegDate: string;
    _MonthEndDate: string;
  };
}

interface ParsedAssignment {
  teacher: string;
  course: string;
  assignment: string;
  score: string;
}

interface WeatherData {
  current: {
    time: string;
    temp: number;
    unit: string;
    condition: string;
    windSpeed: string;
    precipitation: number;
    precipitationUnit: string;
    uvIndex: number;
  };
  ten: Array<{
    date: string;
    tempMin: number;
    tempMax: number;
    condition: string;
    precipitation: number;
  }>;
  location?: string;
}

type TempUnit = "fahrenheit" | "celsius" | "kelvin";

const getTempUnit = (): TempUnit => {
  if (typeof window === "undefined") return "fahrenheit";
  const stored = localStorage.getItem("tempUnit");
  if (stored === "celsius" || stored === "fahrenheit" || stored === "kelvin") {
    return stored;
  }
  return localStorage.getItem("celsius") === "1" ? "celsius" : "fahrenheit";
};

const convertTempFromC = (tempC: number, unit: TempUnit): number => {
  if (!Number.isFinite(tempC)) return tempC;
  if (unit === "celsius") return tempC;
  if (unit === "kelvin") return tempC + 273.15;
  return (tempC * 9) / 5 + 32;
};

const tempUnitLabel = (unit: TempUnit): string => {
  if (unit === "kelvin") return "K";
  if (unit === "celsius") return "°C";
  return "°F";
};

const parseEventDate = (dateStr: string): Date | null => {
  const [month, day, year] = dateStr.split("/").map(Number);
  if (!month || !day || !year) return null;
  return new Date(year, month - 1, day);
};

const parseAssignment = (title: string): ParsedAssignment | null => {
  const separator = " : ";
  const sepIndex = title.lastIndexOf(separator);
  if (sepIndex === -1) return null;

  const left = title.slice(0, sepIndex);
  const right = title.slice(sepIndex + separator.length).trim();

  const doubleSpaceIndex = left.search(/\s{2,}/);
  if (doubleSpaceIndex === -1) return null;

  const teacher = left.slice(0, doubleSpaceIndex).trim();
  const course = left.slice(doubleSpaceIndex).replace(/^\s+/, "");

  const scoreMatch = right.match(/^(.+?)\s*-\s*Score:\s*(.+)$/);
  if (!scoreMatch) {
    return { teacher, course, assignment: right, score: "-" };
  }

  return {
    teacher,
    course,
    assignment: scoreMatch[1].trim(),
    score: scoreMatch[2].trim(),
  };
};

const EventCard = ({
  event,
  parsed,
}: {
  event: CalendarEvent;
  parsed: ParsedAssignment | null;
}) => {
  if (event._DayType === "Holiday") {
    return (
      <Alert className="bg-red-50 dark:bg-red-950">
        <PartyPopper className="size-4" />
        <AlertTitle>{event._Title}</AlertTitle>
        {event._StartTime && (
          <AlertDescription>{event._StartTime}</AlertDescription>
        )}
      </Alert>
    );
  }

  if (event._DayType === "Assignment") {
    if (!parsed) {
      return (
        <Alert className="bg-blue-50 dark:bg-blue-950">
          <BookOpen className="size-4" />
          <AlertTitle>{event._Title}</AlertTitle>
        </Alert>
      );
    }

    return (
      <Alert className="bg-blue-50 dark:bg-blue-950">
        <BookOpen className="size-4" />
        <AlertTitle className="flex items-center gap-2">
          {parsed.assignment}
          <Badge className="ml-auto text-xs">{parsed.score}%</Badge>
        </AlertTitle>
        <AlertDescription>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">{parsed.course}</div>
            <div className="text-xs text-muted-foreground">
              Teacher: {parsed.teacher}
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (event._DayType === "Regular") {
    return (
      <Alert>
        <CalendarDays className="size-4" />
        <AlertTitle>{event._Title}</AlertTitle>
        <AlertDescription>
          {event._StartTime && <div className="mb-2">{event._StartTime}</div>}
          {event._EvtDescription && (
            <div className="whitespace-pre-wrap text-sm">
              {event._EvtDescription.replace(/&#xD;&#xA;/g, "\n")}
            </div>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};

export default function SchoolCalendarPage() {
  const router = useRouter();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(),
  );
  const [month, setMonth] = useState<Date>(new Date());
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [tempUnit, setTempUnit] = useState<TempUnit>(() => getTempUnit());

  const fetchCalendar = useCallback(
    async (requestDate?: Date) => {
      const creds = localStorage.getItem("Student.creds");
      if (!creds) {
        router.push("/login");
        return;
      }

      const credentials = JSON.parse(creds);
      setIsLoading(true);
      setError(null);

      try {
        const body: Record<string, string> = { ...credentials };

        if (requestDate) {
          const m = String(requestDate.getMonth() + 1).padStart(2, "0");
          const d = String(requestDate.getDate()).padStart(2, "0");
          const y = requestDate.getFullYear();
          body.request_date = `${m}/${d}/${y}`;
        }

        const res = await fetch("/api/synergy/calendar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data: CalendarData = await res.json();

        const eventList = data?.CalendarListing?.EventLists?.EventList || [];
        setEvents(Array.isArray(eventList) ? eventList : [eventList]);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    },
    [router],
  );

  const fetchWeather = useCallback(async () => {
    const zip = localStorage.getItem("Student.zip");
    if (!zip) {
      setWeatherLoading(false);
      return;
    }
    const preferredUnit = getTempUnit();
    setTempUnit(preferredUnit);
    setWeatherLoading(true);
    try {
      const res = await fetch("/api/weather", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zip }),
      });
      if (!res.ok) throw new Error("Failed to fetch weather");
      const data: WeatherData = await res.json();
      setWeather(data);
    } catch (err) {
      console.error("Weather fetch error:", err);
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCalendar();
    fetchWeather();
  }, [fetchCalendar, fetchWeather]);

  const handleMonthChange = useCallback(
    (newMonth: Date) => {
      setMonth(newMonth);
      const firstOfMonth = new Date(
        newMonth.getFullYear(),
        newMonth.getMonth(),
        1,
      );
      fetchCalendar(firstOfMonth);
    },
    [fetchCalendar],
  );

  const handlePresetDate = useCallback(
    (days: number) => {
      const newDate = addDays(new Date(), days);
      setSelectedDate(newDate);
      const firstOfMonth = new Date(
        newDate.getFullYear(),
        newDate.getMonth(),
        1,
      );
      setMonth(firstOfMonth);

      if (events.length === 0) {
        fetchCalendar(firstOfMonth);
      }
    },
    [fetchCalendar, events],
  );

  const selectedDayWeather = useMemo(() => {
    if (!weather || !selectedDate) return null;
    const dateStr = selectedDate.toISOString().split("T")[0];
    return weather.ten.find((day) => day.date === dateStr);
  }, [weather, selectedDate]);

  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    const selectedDateStr = selectedDate.toISOString().split("T")[0];
    return events.filter((event) => {
      const eventDate = parseEventDate(event._Date);
      if (!eventDate) return false;
      return eventDate.toISOString().split("T")[0] === selectedDateStr;
    });
  }, [selectedDate, events]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-900 p-9">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </div>
          <div className="lg:col-span-1">
            <Skeleton className="h-[350px] w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-900 p-9">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900 p-9">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 ">
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <CalendarIcon size={20} />
            <p className="text-xl font-medium">
              {selectedDate
                ? selectedDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Select a date"}
            </p>
            {selectedDayWeather && !weatherLoading && (
              <div className="ml-auto flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Cloud className="size-4" />
                  <span className="text-sm">
                    {Math.round(
                      convertTempFromC(selectedDayWeather.tempMin, tempUnit),
                    )}
                    -
                    {Math.round(
                      convertTempFromC(selectedDayWeather.tempMax, tempUnit),
                    )} {tempUnitLabel(tempUnit)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Wind className="size-4" />
                  <span className="text-sm">
                    {selectedDayWeather.condition}
                  </span>
                </div>
                {selectedDayWeather.precipitation !== 0 && (
                  <div className="flex items-center gap-1">
                    <Droplets className="size-4" />
                    <span className="text-sm">
                      {selectedDayWeather.precipitation}mm
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {selectedDateEvents.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
              <p>No events for this day</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDateEvents.map((event, idx) => (
                <EventCard
                  key={idx}
                  event={event}
                  parsed={
                    event._DayType === "Assignment"
                      ? parseAssignment(event._Title)
                      : null
                  }
                />
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="sticky top-6">
            <Card className="w-full">
              <CardContent className="p-4 flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  month={month}
                  onMonthChange={handleMonthChange}
                  fixedWeeks
                  className="p-0"
                />
              </CardContent>
              {![0, 5, 6].includes(new Date().getDay()) && (
                <CardFooter className="flex flex-wrap gap-2 border-t">
                  {[
                    { label: "Today", value: 0 },
                    { label: "Tomorrow", value: 1 },
                    { label: "In 3 days", value: 3 },
                    { label: "In a week", value: 7 },
                    { label: "In 2 weeks", value: 14 },
                  ].map((preset) => (
                    <Button
                      key={preset.value}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handlePresetDate(preset.value)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </CardFooter>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
