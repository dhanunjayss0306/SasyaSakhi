# SasyaSakhi deployment — exact steps (done by you, not by the assistant)

Nothing here is deployed yet. These are the clicks for you to run yourself,
in order. You need: a GitHub account with this repo pushed, a Render
account, and a Vercel account (both free tiers work; sign up with GitHub
on both so connecting the repo is one click).

## Step 0 — Push the repo first

The assistant never pushes. From your laptop, in `C:\Users\dhanu\SasyaSakhi`:

1. `git add -A` — then check with `git status` that `backend/.env` is NOT
   listed (it is git-ignored; if it ever appears, stop and do not commit it).
2. `git commit -m "SasyaSakhi: my-crop flow, Sakhi pet, satellite guidance, deploy configs"`
3. `git push` (paste a fresh GitHub token when asked; revoke it afterwards).

Do not continue until `git status` is clean and GitHub shows the new commit.

## Step 1 — Backend on Render (do this first — the frontend needs its URL)

1. Go to dashboard.render.com → **New +** → **Blueprint** → select the
   `SasyaSakhi` repo → **Apply**. Render reads `render.yaml` in the repo
   root and creates a web service called `sasyasakhi-backend`
   (Python, free plan, build `pip install -r requirements.txt`, start
   `python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`).
2. When the first deploy finishes, open the service → **Environment** →
   **Add Environment Variable**, and set these (paste values, never share
   screenshots of them):
   - `AI_API_KEY` = your Groq key (starts with `gsk_`)
   - `AI_API_BASE` = `https://api.groq.com/openai/v1` (already in render.yaml)
   - `AI_MODEL` = `openai/gpt-oss-120b` (already in render.yaml)
   - `SARVAM_API_KEY` = your Sarvam key (optional — only for future voice
     wiring; the browser mic works without it)
   - `CORS_ORIGINS` = your Vercel URL from Step 2, e.g.
     `https://sasyasakhi.vercel.app` — set this AFTER Step 2, then come back
     and save. Until this matches, the browser blocks backend calls.
3. Click **Save Changes** — Render redeploys automatically.
4. Copy the service URL at the top of the page
   (looks like `https://sasyasakhi-backend.onrender.com`).
5. Verify: open `<that URL>/api/health` in your browser. You should see
   `"status": "ok"` and the workbook listed. If the page takes ~1 minute
   the first time, that is normal: the free plan sleeps when idle and wakes
   on the first request.

Known Render limit (honest, not a bug): the free Python environment has
no Tesseract binary, so photo/scanned-report OCR does not run there —
text-layer PDFs still extract. Photo OCR on the deployed backend needs a
Docker deploy with Tesseract installed, which is a later step, not this one.

## Step 2 — Frontend on Vercel

1. Go to vercel.com → **Add New…** → **Project** → **Import** the
   `SasyaSakhi` repo.
2. On the import screen, set **Root Directory** to `frontend`
   (click Edit next to Root Directory, pick `frontend`, Save).
   Leave Framework Preset as Next.js and leave Build/Output settings
   untouched — Vercel detects them.
3. Open **Environment Variables** and add ONE variable:
   - `NEXT_PUBLIC_API_URL` = your Render URL from Step 1
     (e.g. `https://sasyasakhi-backend.onrender.com`, no trailing slash)
   - Apply it to **Production** (and Preview if offered).
   - Important: this value is baked in at build time. If you ever change
     it, you must redeploy for it to take effect.
4. Click **Deploy**. When it finishes, open the given URL
   (e.g. `https://sasyasakhi.vercel.app`).
5. Go back to Render Step 1 and set `CORS_ORIGINS` to exactly this Vercel
   URL, then save (Render redeploys).
6. Verify on the Vercel URL: upload the sample report, open the assistant
   and ask an open question — you should get a real AI answer, not the
   template summary. If the assistant falls back to templates, check the
   Render logs for `AI provider failed` and re-check the env vars.

## Step 3 — Local development (unchanged)

- Backend terminal, from `C:\Users\dhanu\SasyaSakhi\backend`:
  `python -m uvicorn app.main:app --reload --port 8000`
- Frontend terminal, from `C:\Users\dhanu\SasyaSakhi\frontend`:
  `npm run dev` (with `frontend/.env.local` containing
  `NEXT_PUBLIC_API_URL=http://localhost:8000`)
- Open http://localhost:3000.

## Why NOT Cloudflare Pages or GitHub Pages?

Both are **static-only hosts**: they serve HTML/CSS/JS files and nothing
else. They cannot run a Python server, so the FastAPI backend has nowhere
to run there — and without a backend there is no OCR, no rules engine, no
zone lookup, no satellite check, and no AI chat. They also cannot run
Next.js server features (Vercel runs Next.js natively, which is why the
frontend goes there). So the split is fixed: **frontend → Vercel,
backend → Render**. GitHub stays as the code home both deploy from.

## Checklist (all yours)

- [ ] Repo pushed, `backend/.env` never committed
- [ ] Render Blueprint applied, env vars set, `/api/health` OK
- [ ] Vercel project imported with Root Directory `frontend`,
      `NEXT_PUBLIC_API_URL` set, deployed
- [ ] `CORS_ORIGINS` on Render = Vercel URL, redeployed
- [ ] Live site: sample upload + real AI answer verified
