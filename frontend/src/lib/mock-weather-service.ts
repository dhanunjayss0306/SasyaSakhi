import { MOCK_WEATHER, MOCK_CALENDAR, type WeatherDay, type CalendarEvent } from "./mock-data";
import { getLiveWeather } from "./api-client";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Backend wiring (service layer only — pages and UI are untouched).
 *
 * The backend is attempted ONLY when NEXT_PUBLIC_API_URL is set in
 * frontend/.env.local. When unset, behavior is exactly as before: mock data,
 * no network calls, no console noise. On any backend failure, mock data is
 * returned — getWeather() never throws, so the weather page never breaks.
 *
 * NOTE: the frontend has no location picker, so live weather uses the sample
 * farm region (Vijayawada, 16.5062, 80.6480). The weather page carries a
 * static "Demo data" badge that only a page change can remove — live data
 * renders under it until then.
 */

const API_ENABLED = Boolean(process.env.NEXT_PUBLIC_API_URL);

// Sample farm region (matches the demo report's region). Replace with a real
// location picker when the app gains one.
const DEFAULT_LAT = 16.5062;
const DEFAULT_LON = 80.6480;

interface LiveDay {
  date: string;
  max_c: number | null;
  min_c: number | null;
  rain_mm: number | null;
  rain_prob_pct: number | null;
}

interface LiveWeatherResponse {
  available?: boolean;
  forecast_3day?: LiveDay[];
  fertilizer_timing_advisory?: { level?: string; text?: string };
}

function iconFor(rainProb: number | null, rainMm: number | null): WeatherDay["icon"] {
  if ((rainProb ?? 0) >= 50 || (rainMm ?? 0) >= 5) return "cloud-rain";
  if ((rainProb ?? 0) >= 25) return "cloud-sun";
  return "sun";
}

function dayName(dateStr: string, index: number): string {
  if (index === 0) return "Today";
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return `Day ${index + 1}`;
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

export interface WeatherResult {
  days: WeatherDay[];
  /** "live" only when the days actually came from the backend forecast. */
  source: "live" | "mock";
}

export async function getWeather(): Promise<WeatherResult> {
  if (API_ENABLED) {
    try {
      const live = (await getLiveWeather(
        DEFAULT_LAT,
        DEFAULT_LON,
      )) as LiveWeatherResponse;
      const days = (live.forecast_3day ?? []).filter(
        (d) => d.max_c !== null && d.min_c !== null,
      );
      if (live.available !== false && days.length > 0) {
        return {
          days: days.map((d, i) => ({
            day: dayName(d.date, i),
            icon: iconFor(d.rain_prob_pct, d.rain_mm),
            tempHigh: Math.round(d.max_c as number),
            tempLow: Math.round(d.min_c as number),
            rainChance: d.rain_prob_pct ?? 0,
            advice:
              i === 0 && live.fertilizer_timing_advisory?.text
                ? live.fertilizer_timing_advisory.text
                : (d.rain_prob_pct ?? 0) >= 50
                  ? "Rain likely — hold fertilizer application."
                  : "Good day for field work.",
          })),
          source: "live",
        };
      }
    } catch {
      console.debug("SasyaSakhi: live weather unavailable, using mock weather.");
    }
  }
  await delay(600);
  return { days: MOCK_WEATHER, source: "mock" };
}

export async function getCalendarEvents(): Promise<CalendarEvent[]> {
  // No backend endpoint serves dated calendar events: the tracking endpoint
  // returns stage splits without dates, and inventing dates would be fake
  // data. Stays mock until the backend gains a schedule-with-dates endpoint.
  await delay(400);
  return MOCK_CALENDAR;
}
