# SasyaSakhi — Backend

FastAPI backend for the SasyaSakhi hackathon prototype: soil-report OCR
(Tesseract), deterministic soil analysis, rule-based crop suitability
(paddy / cotton / chilli), fertiliser recommendations (workbook STCR rules when
available), and a Telugu/English AI assistant (template fallback when no AI key).

The frontend lives in `../frontend/` (Next.js, Team 2). This backend does not
touch it — see "Wiring the frontend" below.

## Requirements

- Python **3.11+** (3.12 recommended)
- **Tesseract OCR** — for scanning uploaded reports
- **Poppler** (`pdftoppm`) — for rendering scanned PDFs before OCR
- Team 1's Excel workbook in `data/` (optional but needed for real crop /
  fertiliser rules — see `data/README.md`)

---

## Windows setup (exact commands)

Run in PowerShell (or CMD — same commands work).

**1. Install Python 3.12** from https://www.python.org/downloads/ — tick
**"Add python.exe to PATH"** during install. Verify:

```powershell
python --version   # expect Python 3.12.x
```

**2. Install Tesseract OCR** from https://github.com/UB-Mannheim/tesseract/wiki
(download the 64-bit installer, e.g. `tesseract-ocr-w64-setup-*.exe`).
During install, tick **"Additional language data" → English**. Note the
install folder, usually:

```
C:\Program Files\Tesseract-OCR\tesseract.exe
```

Verify in a **new** terminal:

```powershell
tesseract --version
```

If `tesseract` is not recognised, either add
`C:\Program Files\Tesseract-OCR` to your system PATH (search "environment
variables" → Path → Edit → New), **or** skip PATH and set this in your `.env`
instead (step 5):

```
TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe
```

**3. Install Poppler for Windows** (needed only for scanned PDFs):
download the latest release from
https://github.com/oschwartz10612/poppler-windows/releases/
(unzip, e.g. to `C:\poppler`), then add `C:\poppler\Library\bin` to PATH.
Verify:

```powershell
pdftoppm -v
```

**4. Create a virtual environment and install dependencies:**

```powershell
cd path\to\soilsaathi\backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

**5. Configure environment:**

```powershell
copy .env.example .env
notepad .env
```

Set at minimum (defaults work for a local demo):

```
CORS_ORIGINS=http://localhost:3000
TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe   # only if not on PATH
```

Optional: `AI_API_KEY` (+ `AI_API_BASE`, `AI_MODEL`) for real AI explanations;
without it the assistant uses deterministic templates (fine for the demo).

**6. Team 1's workbook** is in `data/` (`SoilSaathi_ML_Crop_Nutrient_Datasets_800Rows.xlsx`,
copied from the shared files). It powers the STCR fertilizer engine, workbook
crop-suitability ranges, fertility-rating bands, the fertilizer split schedule,
and the 100-case OCR ground-truth test. If you replace it, keep one of the two
recognized filenames — see `data/README.md` for the expected sheet layout.

**7. Start the backend:**

```powershell
.venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

Open http://localhost:8000/docs for the interactive API docs, and
http://localhost:8000/api/health for the readiness check.

## Linux / macOS quick start

```bash
sudo apt-get install -y tesseract-ocr tesseract-ocr-eng poppler-utils  # Debian/Ubuntu
cd soilsaathi/backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

---

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Service, OCR engine, and dataset readiness |
| POST | `/api/soil-reports/extract` | Upload PDF/image → OCR → extracted fields for review |
| POST | `/api/soil-reports/{report_id}/confirm` | Farmer-corrected values (missing stays missing) |
| GET | `/api/soil-reports/{report_id}` | Report status |
| POST | `/api/soil-analysis` | Deterministic analysis of confirmed values |
| POST | `/api/recommendations/crops` | Paddy/cotton/chilli suitability |
| POST | `/api/recommendations/fertilizer` | STCR/workbook rules, else labelled `needs_review` |
| POST | `/api/assistant/chat` | Telugu/English explanations (AI or template) |
| GET | `/api/weather?lat=..&lon=..` | Real weather via Open-Meteo; never invented |
| GET | `/api/weather/live?lat=..&lon=..` | Rain-aware live weather: current + 48 h hourly rain + 3-day outlook + fertilizer-timing advisory |
| GET | `/api/soil/satellite?lat=..&lon=..` | ISRIC SoilGrids v2.0 MODELLED soil data (~250 m) — estimates, not lab measurements |
| GET | `/api/tracking/fertilizer-schedule?crop=..&n_kg_ha=..` | Prototype N-split schedule from dataset percentages (+ optional `lat`/`lon` rain advisory) |
| GET | `/api/demo/sample-report` | **Synthetic** labelled demo data (not from OCR) |

Request/response schemas: Pydantic models in `app/models/`. Full interactive
docs at `/docs` when the server runs.

## Satellite soil data (ISRIC SoilGrids v2.0) — what it can and can't do

`GET /api/soil/satellite?lat=..&lon=..` fetches modelled soil properties. Free,
no key. Findings from live testing:

- **Can:** pH (phh2o), organic carbon (soc), nitrogen (g/kg), clay, sand, CEC,
  bulk density at 0–5 cm and 5–15 cm, ~250 m resolution.
- **Can't:** phosphorus and potassium are NOT in SoilGrids v2.0 at all.
- **Coverage gaps are real:** the API returns HTTP 200 with `null` values for
  parts of coastal/southern India (observed: Visakhapatnam, Vijayawada,
  Hyderabad, Chennai, Delhi) while working elsewhere (Punjab, Iowa). The
  endpoint reports `available: false` with a "coverage gap" reason in that case.
- Nitrogen comes in g/kg and is NOT converted to kg/ha (that needs bulk
  density assumptions) — it is labelled as not directly comparable.
- Fair use, no published hard rate limit; responses are not cached
  server-side in this prototype — don't hammer it from a loop.

## Live weather (Open-Meteo) — rain-aware fertilizer timing

`GET /api/weather/live?lat=..&lon=..` returns current conditions, hourly rain
for the next 48 h, a 3-day outlook, and a heuristic advisory (`postpone` /
`caution` / `favourable`) for fertilizer timing. Free, no key. The advisory is
a simple rain heuristic, labelled as such. Weather is optional enrichment only:
it never blocks `/api/soil-analysis` or any other endpoint, and every failure
degrades to `{"available": false}`.

> Sandbox note: in this VM, outbound HTTPS goes through an egress proxy that
> httpx 0.28.1 cannot parse, so the live endpoints return `available: false`
> here. On a normal machine (his Windows dev box, Vercel, etc.) they work —
> API responses were verified via curl and the parsing/fallback logic is
> covered by mocked tests.

## Prototype fertilizer schedule (no invented days)

`GET /api/tracking/fertilizer-schedule?crop=paddy&n_kg_ha=120` splits an N dose
across Basal / Tillering / Panicle using ONLY the dataset's `N_Split_*_pct`
values, with the dataset's duration window and urea equivalents. Exact
days-after-sowing are NOT in the dataset and are never invented — the response
says so explicitly. Add `lat`/`lon` for the rain-aware advisory.

## The 5-minute demo script

1. `GET /api/health` — show service + dataset status.
2. `GET /api/demo/sample-report` — loads the synthetic sample (labelled demo).
3. `POST /api/soil-analysis` with the demo `report_id`.
4. `POST /api/recommendations/crops` then `/fertilizer` with the `report_id`.
5. `POST /api/assistant/chat` — `{"language":"te","message":"pH అంటే ఏమిటి?","report_id":"..."}`.
6. (Live OCR) `POST /api/soil-reports/extract` with a real report photo → review →
   confirm → same steps 3–5.

## Wiring the frontend (Team 2, 2 steps — no existing code changes)

1. Create `frontend/.env.local`:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```
2. Import from the new additive client (already added, nothing else touched):
   ```ts
   import { extractReport, confirmReport, analyzeSoil } from "@/lib/api-client";
   ```
   Call these where the `mock-*` services are used today. Handle the honest
   degraded states: `extractReport` → `{success:false}` means "ask for manual
   entry"; fertiliser → `status:"needs_review"` + `dose_basis:"general_reference"`.

Also set the backend's `CORS_ORIGINS` to the frontend's origin
(e.g. the Vercel URL when deployed).

## Tests

```powershell
.venv\Scripts\activate
pytest -q
```

Covers: workbook missing/malformed handling, parser (labels, units, decimals,
OCR confusions, P-vs-P2O5), analysis rules, crop/fertiliser engines, OCR on the
synthetic sample (skipped if Tesseract isn't installed), and end-to-end API
flows.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `tesseract --version` not recognised | Reopen the terminal after install; or set `TESSERACT_CMD` in `.env` |
| Scanned PDF pages not read | Install Poppler and put `bin` on PATH (`pdftoppm -v` must work) |
| OCR returns gibberish | Use a straight, well-lit photo; the demo sample in `data/` shows a readable layout |
| CORS errors from the frontend | Set `CORS_ORIGINS` in `.env` to the exact frontend origin and restart |
| `fertilizer` returns `needs_review` | Expected without the workbook — drop Team 1's `.xlsx` in `data/` |
| Assistant answers feel generic | Set `AI_API_KEY` for real explanations; templates are intentionally conservative |

## Project layout

```
backend/
  app/main.py            FastAPI app, CORS, lifespan (loads workbook once)
  app/config.py          env-based config, no secrets in code
  app/api/              routers: health, soil_reports, analysis, recommendations, assistant, weather
  app/services/         ocr_service, pdf_service, soil_parser, data_loader,
                        soil_analysis, crop_recommendation, fertilizer_calculator,
                        explanation_service, weather_service, report_store
  app/models/           Pydantic contracts: soil, crop, recommendation, assistant
  data/                 workbook goes here + synthetic demo fixture + README
  tests/                pytest suite
```

## Honesty rules baked in

- OCR output is never trusted without farmer confirmation (`needs_review`).
- Missing values are never filled with zero.
- Confidence percentages come only from the OCR engine, never invented.
- Without Team 1's workbook: crop rules use labelled built-in defaults,
  fertiliser returns `needs_review` with a labelled general reference.
- Demo data is always labelled `is_demo` / `SYNTHETIC` and never presented as OCR output.
- No secrets in code — `.env.example` has placeholders only.
