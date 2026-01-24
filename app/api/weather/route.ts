import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface WeatherResponse {
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

async function zipToCoords(zip: string): Promise<{ lat: number; lon: number }> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(zip)}&country=US&format=json&limit=1`,
    {
      headers: { "User-Agent": "student-portal" },
    }
  );
  const data = await res.json();

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Zip code not found");
  }

  const result = data[0];
  return { lat: parseFloat(result.lat), lon: parseFloat(result.lon) };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { zip } = body;
    if (!zip) {
      return NextResponse.json(
        { error: "zip code is required" },
        { status: 400 }
      );
    }

    const { lat, lon } = await zipToCoords(String(zip).trim());

    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m,precipitation,uv_index&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code&timezone=auto&forecast_days=10`
    );

    if (!weatherRes.ok) {
      throw new Error("Failed to fetch weather data");
    }

    const weatherData = await weatherRes.json();
    const current = weatherData.current;

    const weatherCodeMap: Record<number, string> = {
      0: "Clear",
      1: "Mostly Clear",
      2: "Partly Cloudy",
      3: "Overcast",
      45: "Foggy",
      48: "Foggy",
      51: "Light Drizzle",
      53: "Drizzle",
      55: "Heavy Drizzle",
      61: "Light Rain",
      63: "Rain",
      65: "Heavy Rain",
      71: "Light Snow",
      73: "Snow",
      75: "Heavy Snow",
      77: "Snow Grains",
      80: "Light Showers",
      81: "Showers",
      82: "Heavy Showers",
      85: "Snow Showers",
      86: "Heavy Snow Showers",
      95: "Thunderstorm",
      96: "Thunderstorm with Hail",
      99: "Thunderstorm with Heavy Hail",
    };

    const condition = weatherCodeMap[current.weather_code] || "Unknown";

    const tenDay = weatherData.daily.time.map((date: string, idx: number) => ({
      date,
      tempMin: weatherData.daily.temperature_2m_min[idx],
      tempMax: weatherData.daily.temperature_2m_max[idx],
      condition: weatherCodeMap[weatherData.daily.weather_code[idx]] || "Unknown",
      precipitation: weatherData.daily.precipitation_sum[idx] || 0,
    }));

    const response: WeatherResponse = {
      current: {
        time: weatherData.current_time,
        temp: current.temperature_2m,
        unit: weatherData.current_units.temperature_2m || "°C",
        condition,
        windSpeed: `${current.wind_speed_10m} ${weatherData.current_units.wind_speed_10m || "km/h"}`,
        precipitation: current.precipitation || 0,
        precipitationUnit: weatherData.current_units.precipitation || "mm",
        uvIndex: current.uv_index || 0,
      },
      ten: tenDay,
      location: `${lat.toFixed(2)}, ${lon.toFixed(2)}`,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
