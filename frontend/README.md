This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Backend wiring

The pages use `src/lib/mock-*.ts` services. Those services now try the
FastAPI backend first and fall back to the previous mock data on any
failure — pages, routes, and UI are unchanged.

### Run both servers

```bash
# Terminal 1 — backend (from the backend folder)
cd ../backend
.venv/bin/uvicorn app.main:app --reload --port 8000

# Terminal 2 — frontend (from this folder), with the backend URL set
# BEFORE starting the dev server (Next.js inlines NEXT_PUBLIC_* at build time)
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
npm run dev   # -> http://localhost:3000
```

Without `NEXT_PUBLIC_API_URL`, the app behaves exactly as before: pure mock
data, no network calls, no console noise. With it set, the backend is tried
first and mock data is used only as fallback.

### What is live vs mock today

| Flow | With backend up | Without backend |
| --- | --- | --- |
| Sample report button | Real backend demo values (`/api/demo/sample-report`) + real status assessments | Mock sample (as before) |
| Photo upload | Real OCR — see one-line follow-up below | Mock sample relabelled (as before) |
| Weather page | Live Open-Meteo forecast (Vijayawada default; no location picker yet) | Mock weather (as before) |
| Analysis page | Real statuses from backend assessments when the report came from the backend | Mock statuses (as before) |
| Recommendations, fertilizer, calendar, chat, dashboard | Mock (see below) | Mock (as before) |

Mock fallback data keeps its demo labels. Real backend data is never
relabelled as mock. The analysis, recommendations, and weather pages carry
static "Demo data" banners that only a page change can remove — live data
renders under them until then.

### Deliberately NOT wired (needs a page/component change)

- **Photo upload (real OCR):** `ReportUploader` holds the `File` but calls
  `onProcess(file.name)` — only the filename reaches the service, so the
  service cannot send the file to `POST /api/soil-reports/extract`. The
  service already accepts `File | string` and the backend path is
  implemented and ready. One-line change in each file to activate it:
  `ReportUploader`: `onProcess(file)` instead of `onProcess(file.name)`,
  and the soil-report page's `handleProcess` takes the `File` and calls
  `extractFromFile(file)`. Also install Tesseract on the machine running
  the backend, or extraction returns "OCR engine unavailable" and the
  service falls back to mock.
- **Confirm to backend:** `POST /soil-reports/{id}/confirm` works, but the
  review page only validates locally (`confirmValues`). Wire it by awaiting
  a service call after validation passes.
- **Recommendations / fertilizer:** the page calls these synchronously, but
  backend calls are async; the backend returns status labels
  (suitable/marginal/unsuitable) while the page renders a numeric
  suitability score (mapping labels to numbers would invent scores); and
  `FertilizerRec` forces `illustrative: true` plus a per-acre cost while
  the backend returns calculated doses with no prices. Wiring needs the
  page to go async + label-based UI (Best/Good/Fair). Send canonical
  nutrient names (N, P, K) to the fertilizer endpoint — oxide forms
  (P2O5/K2O) fall back to `needs_review` by backend design.
- **Chat:** the chat window calls the mock reply synchronously; the
  backend `POST /api/assistant/chat` works but needs the component to go
  async.
- **Calendar:** no backend endpoint serves dated events (the tracking
  endpoint returns stage splits without dates); inventing dates would be
  fake data.
- **Login:** mock only, by design. `mockSignIn` accepts any valid email +
  6+ character password and redirects to `/dashboard`. Real auth needs a
  database (Supabase in the original plan) and is out of scope here.
