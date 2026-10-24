"""Backend configuration from environment variables. No secrets live in code."""
import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent  # backend/ (contains app/ and data/)
DATA_DIR = Path(os.getenv("DATA_DIR", str(BASE_DIR / "data")))

# Comma-separated list of allowed frontend origins.
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",") if o.strip()]

# Max upload size for soil reports (default 10 MB).
MAX_UPLOAD_MB = float(os.getenv("MAX_UPLOAD_MB", "10"))

# Optional AI explanation provider (OpenAI-compatible chat-completions endpoint).
AI_API_KEY = os.getenv("AI_API_KEY", "")
AI_API_BASE = os.getenv("AI_API_BASE", "https://api.openai.com/v1")
AI_MODEL = os.getenv("AI_MODEL", "gpt-4o-mini")

# Tesseract executable override (Windows: set full path, e.g. C:\Program Files\Tesseract-OCR\tesseract.exe).
TESSERACT_CMD = os.getenv("TESSERACT_CMD", "")

APP_NAME = "SasyaSakhi Backend"
APP_VERSION = "0.1.0"
