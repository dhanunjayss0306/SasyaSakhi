import type { SoilReport } from "@/types/soil";
import type { Crop } from "@/types/crop";

/**
 * Central mock dataset for the SasyaSakhi frontend prototype.
 * Everything here is illustrative sample data — clearly labelled in the UI.
 */

export const MOCK_NOTICE =
  "Demo data — this is a prototype. Values are illustrative samples, not lab results.";

export const SAMPLE_SOIL_REPORT: SoilReport = {
  id: "demo-report-001",
  fileName: "sample-soil-report.pdf",
  uploadedAt: "2026-10-20T09:30:00+05:30",
  mockNotice: MOCK_NOTICE,
  parameters: [
    { key: "ph", label: "pH", labelTe: "పీహెచ్", value: 6.5, unit: "", status: "optimal" },
    { key: "ec", label: "EC", labelTe: "ఈసీ", value: 0.42, unit: "dS/m", status: "optimal" },
    { key: "oc", label: "Organic Carbon", labelTe: "సేంద్రియ కార్బన్", value: 0.6, unit: "%", status: "optimal" },
    { key: "n", label: "Nitrogen (N)", labelTe: "నత్రజని", value: 280, unit: "kg/ha", status: "optimal" },
    { key: "p", label: "Phosphorus (P)", labelTe: "భాస్వరం", value: 22, unit: "kg/ha", status: "low", uncertain: true },
    { key: "k", label: "Potassium (K)", labelTe: "పొటాషియం", value: 310, unit: "kg/ha", status: "high" },
  ],
};

export const CROPS: Crop[] = [
  {
    id: "paddy",
    name: "Paddy",
    nameTe: "వరి",
    suitability: 92,
    description:
      "Your soil's pH and nitrogen levels sit comfortably in paddy's preferred range. With assured irrigation, this is your strongest option this season.",
    descriptionTe: "మీ నేల pH మరియు నత్రజని స్థాయిలు వరికి అనుకూలంగా ఉన్నాయి.",
    season: "Kharif (Jun–Nov)",
    waterNeed: "High",
    soilFactors: ["pH 6.5 in ideal 5.5–7.0 band", "Nitrogen 280 kg/ha supports tillering", "Good water retention expected"],
  },
  {
    id: "cotton",
    name: "Cotton",
    nameTe: "పత్తి",
    suitability: 78,
    description:
      "Cotton tolerates your slightly elevated potassium well. Phosphorus is on the lower side, so a basal DAP dose matters more for this crop.",
    descriptionTe: "పత్తికి మీ నేల అనుకూలం; భాస్వరం తక్కువగా ఉంది.",
    season: "Kharif (Apr–Oct)",
    waterNeed: "Medium",
    soilFactors: ["Tolerates higher potassium", "Needs phosphorus correction at sowing", "Prefers well-drained patches"],
  },
  {
    id: "chilli",
    name: "Chilli",
    nameTe: "మిరప",
    suitability: 65,
    description:
      "Chilli is viable but the most sensitive of the three to your low phosphorus. Works best with nursery-raised seedlings and careful basal dosing.",
    descriptionTe: "మిరప సాధ్యమే కానీ భాస్వరం తక్కువగా ఉండటం వల్ల జాగ్రత్త అవసరం.",
    season: "Kharif/Rabi (Jul–Feb)",
    waterNeed: "Medium",
    soilFactors: ["Sensitive to low phosphorus", "Benefits from organic manure", "Avoid waterlogging"],
  },
];

export interface WeatherDay {
  day: string;
  icon: "sun" | "cloud-sun" | "cloud-rain" | "cloud";
  tempHigh: number;
  tempLow: number;
  rainChance: number;
  advice: string;
}

export const MOCK_WEATHER: WeatherDay[] = [
  { day: "Today", icon: "cloud-sun", tempHigh: 32, tempLow: 24, rainChance: 20, advice: "Good day for field work." },
  { day: "Sat", icon: "sun", tempHigh: 33, tempLow: 24, rainChance: 10, advice: "Ideal for spraying in the morning." },
  { day: "Sun", icon: "cloud-rain", tempHigh: 30, tempLow: 23, rainChance: 70, advice: "Hold fertilizer application; rain likely." },
  { day: "Mon", icon: "cloud-rain", tempHigh: 29, tempLow: 23, rainChance: 60, advice: "Check drainage in low patches." },
  { day: "Tue", icon: "cloud-sun", tempHigh: 31, tempLow: 24, rainChance: 25, advice: "Resume field operations." },
];

export interface CalendarEvent {
  date: string;
  title: string;
  titleTe: string;
  crop: string;
  done: boolean;
}

export const MOCK_CALENDAR: CalendarEvent[] = [
  { date: "2026-10-26", title: "Basal DAP application", titleTe: "డీఏపీ వేయండి", crop: "Paddy", done: false },
  { date: "2026-11-02", title: "First top-dress urea", titleTe: "యూరియా తొలి డోసు", crop: "Paddy", done: false },
  { date: "2026-11-10", title: "Weed inspection", titleTe: "కలుపు పరిశీలన", crop: "Cotton", done: false },
  { date: "2026-10-18", title: "Soil sample collected", titleTe: "మట్టి నమూనా", crop: "All", done: true },
];

export const MOCK_REPORT_HISTORY = [
  { id: "demo-report-001", fileName: "sample-soil-report.pdf", date: "20 Oct 2026", status: "Analyzed" },
  { id: "demo-report-000", fileName: "kharif-2025-report.jpg", date: "14 Jun 2025", status: "Analyzed" },
];

export const SUGGESTED_QUESTIONS = [
  "What does my pH mean?",
  "Why is paddy suitable for my soil?",
  "How much urea should I apply?",
  "నా నేల ఆరోగ్యం ఎలా ఉంది?",
];

export const MOCK_CHAT_RESPONSES: Record<string, string> = {
  default:
    "Based on your sample report (demo data): your soil health is Good. pH 6.5 is in the ideal band for paddy and cotton. Phosphorus is a touch low at 22 kg/ha, so basal DAP at sowing is worth prioritizing. Want me to explain any single value in detail?",
  ph: "pH 6.5 means your soil is very slightly acidic — right in the sweet spot (6.0–7.0) where paddy, cotton and chilli all absorb nutrients well. No lime or gypsum correction needed for this sample.",
  paddy:
    "Paddy scores 92% for your sample soil because pH 6.5 sits inside its ideal 5.5–7.0 band and nitrogen at 280 kg/ha supports strong tillering. It needs assured irrigation through the season.",
  urea:
    "For the sample report, the illustrative plan suggests 50 kg of urea per acre as a top-dress dose (about ₹300). This is demo data — always confirm doses with your local agriculture officer before buying.",
  telugu:
    "మీ నమూనా నివేదిక ప్రకారం మీ నేల ఆరోగ్యం బాగుంది. pH 6.5 వరి మరియు పత్తికి అనుకూలం. భాస్వరం కొద్దిగా తక్కువగా ఉంది (22 kg/ha), కాబట్టి విత్తేటప్పుడు DAP వేయడం మంచిది.",
};

export function mockChatReply(question: string): string {
  const q = question.toLowerCase();
  if (/[\u0c00-\u0c7f]/.test(question)) return MOCK_CHAT_RESPONSES.telugu;
  if (q.includes("ph")) return MOCK_CHAT_RESPONSES.ph;
  if (q.includes("paddy") || q.includes("వరి")) return MOCK_CHAT_RESPONSES.paddy;
  if (q.includes("urea") || q.includes("fertilizer") || q.includes("dap")) return MOCK_CHAT_RESPONSES.urea;
  return MOCK_CHAT_RESPONSES.default;
}
