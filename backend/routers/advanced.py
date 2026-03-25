from __future__ import annotations

from fastapi import APIRouter, Query
from pydantic import BaseModel
from utils.streamer import stream_response
from modules.advanced.nuclei_runner import nuclei_run
from modules.advanced.custom_script import run_custom_script

router = APIRouter(prefix="/api/advanced", tags=["advanced"])


@router.get("/nuclei")
async def nuclei(
    target: str = Query(...),
    templates: str = Query("cves,misconfiguration,exposures"),
):
    return stream_response(nuclei_run(target, templates))


class ScriptRequest(BaseModel):
    script: str
    target: str = ""


@router.post("/script")
async def custom_script(req: ScriptRequest):
    return stream_response(run_custom_script(req.script, req.target))
