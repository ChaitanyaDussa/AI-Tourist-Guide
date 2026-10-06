# Travel Guide - AI Audio Guide

Flask backend (Gemini text + Murf voice) and a static HTML/JS frontend.

## Features
- Search tourist places (6 featured cards + Wikipedia-powered search)
- Historical information by Gemini: Summary (~1 min) or Detailed (~3 min), with optional key points to cover
- AI audio guide narrated by Murf, with a text transcript
- English, Hindi, Tamil and Telugu; Male/Female voice per language
- Trip planner: 1-5 day itinerary with daily start/end times, timed stops and your own notes, in the chosen language
- Ask the Guide: chat for any question about the selected place

## Structure
- `Backend/`  Flask API. Keys live in `Backend/.env` (never pushed).
- `Frontend/` Static site. `config.js` holds only the backend URL.

## Run locally
Backend (terminal 1):
    cd Backend
    python -m venv venv
    venv\Scripts\activate          (macOS/Linux: source venv/bin/activate)
    pip install -r requirements.txt
    python app.py

Frontend (VS Code): right-click `Frontend/index.html` -> "Open with Live Server"
(runs on http://127.0.0.1:5500).

## Deploy on Vercel (two projects)
1. Backend: import repo, Root Directory = `Backend`. Add env vars GEMINI_API_KEY,
   MURF_API_KEY, GEMINI_MODEL, ALLOWED_ORIGINS (your frontend URL).
2. Frontend: set `API_BASE_URL` in `Frontend/config.js` to the backend URL, then
   import repo with Root Directory = `Frontend`.
3. Put the frontend URL into the backend's ALLOWED_ORIGINS and redeploy the backend.
