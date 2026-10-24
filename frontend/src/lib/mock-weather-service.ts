import { MOCK_WEATHER, MOCK_CALENDAR, type WeatherDay, type CalendarEvent } from "./mock-data";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function getWeather(): Promise<WeatherDay[]> {
  await delay(600);
  return MOCK_WEATHER;
}

export async function getCalendarEvents(): Promise<CalendarEvent[]> {
  await delay(400);
  return MOCK_CALENDAR;
}
