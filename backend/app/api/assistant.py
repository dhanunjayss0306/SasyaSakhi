"""AI assistant chat endpoint."""
from fastapi import APIRouter

from app.models.assistant import ChatRequest, ChatResponse
from app.models.crop import CropSuitabilityResponse
from app.models.recommendation import FertilizerResponse, SoilAnalysisResponse
from app.services import crop_recommendation, explanation_service, fertilizer_calculator, soil_analysis
from app.services.report_store import get_confirmed

router = APIRouter()


def _build_context(report_id: str | None, extra: dict | None) -> dict:
    ctx: dict = dict(extra or {})
    if report_id:
        confirmed = get_confirmed(report_id)
        if confirmed:
            ctx.setdefault("confirmed_values", confirmed)
            # Recalculate server-side so the assistant never trusts client numbers.
            assessments, _ = soil_analysis.analyze(confirmed)
            ctx["soil_analysis"] = [a.model_dump() for a in assessments]
            suits, _ = crop_recommendation.evaluate_all(confirmed)
            ctx["crop_suitability"] = [s.model_dump() for s in suits]
    return ctx


@router.post("/assistant/chat", response_model=ChatResponse)
def chat(body: ChatRequest):
    language = "te" if body.language.lower().startswith("te") else "en"
    context = _build_context(body.report_id, body.context)
    text, sources, mode = explanation_service.answer(body.message, language, context)
    return ChatResponse(success=True, language=language, answer=text,
                        source_ids=sources, mode=mode)
