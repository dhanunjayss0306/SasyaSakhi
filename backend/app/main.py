"""SasyaSakhi backend — FastAPI application entrypoint."""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import config
from app.api import analysis, assistant, health, ml, recommendations, satellite, soil_reports, tracking, weather, zones
from app.services.data_loader import loader

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
log = logging.getLogger("soilsaathi.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    status = loader.load()
    if status.workbook_found:
        log.info("Workbook loaded: %s (%d sheets)", status.workbook_path, len(status.sheets))
    else:
        log.warning("No workbook found — running in degraded mode: %s", status.workbook_error)
    yield


app = FastAPI(title=config.APP_NAME, version=config.APP_VERSION, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(soil_reports.router, prefix="/api", tags=["soil-reports"])
app.include_router(satellite.router, prefix="/api", tags=["satellite"])
app.include_router(tracking.router, prefix="/api", tags=["tracking"])
app.include_router(analysis.router, prefix="/api", tags=["analysis"])
app.include_router(recommendations.router, prefix="/api", tags=["recommendations"])
app.include_router(assistant.router, prefix="/api", tags=["assistant"])
app.include_router(weather.router, prefix="/api", tags=["weather"])
app.include_router(ml.router, prefix="/api", tags=["ml"])
app.include_router(zones.router, prefix="/api", tags=["zones"])


@app.get("/")
def root():
    return {"service": config.APP_NAME, "version": config.APP_VERSION,
            "docs": "/docs", "health": "/api/health"}
