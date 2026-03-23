from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import List, Optional
from utils.streamer import stream_response
from utils.validator import validate_hash
from modules.password.hash_identifier import identify_hash
from modules.password.hash_cracker import crack_hash
from modules.password.wordlist_gen import generate_wordlist
from modules.password.credential_tester import test_credentials

router = APIRouter(prefix="/api/password", tags=["password"])


@router.get("/identify")
async def identify(hash: str = Query(...)):
    h = validate_hash(hash)
    return stream_response(identify_hash(h))


class CrackRequest(BaseModel):
    hash: str
    hash_type: str
    wordlist: Optional[str] = None
    use_mutations: Optional[bool] = True


@router.post("/crack")
async def crack(req: CrackRequest):
    h = validate_hash(req.hash)
    return stream_response(crack_hash(h, req.hash_type, req.wordlist, req.use_mutations))


class WordlistRequest(BaseModel):
    seeds: List[str]
    use_leet: Optional[bool] = True
    use_numbers: Optional[bool] = True
    use_years: Optional[bool] = True
    min_length: Optional[int] = 6
    max_length: Optional[int] = 20
    output_path: Optional[str] = None


@router.post("/wordlist")
async def wordlist(req: WordlistRequest):
    return stream_response(generate_wordlist(
        req.seeds, req.use_leet, req.use_numbers, req.use_years,
        req.min_length, req.max_length, req.output_path
    ))


class CredRequest(BaseModel):
    url: str
    usernames: List[str]
    passwords: List[str]
    auth_type: Optional[str] = "basic"
    success_pattern: Optional[str] = None
    success_status: Optional[int] = 200
    delay: Optional[float] = 0.5
    form_user_field: Optional[str] = "username"
    form_pass_field: Optional[str] = "password"


@router.post("/credentials")
async def credentials(req: CredRequest):
    return stream_response(test_credentials(
        req.url, req.usernames, req.passwords, req.auth_type,
        req.success_pattern, req.success_status, req.delay,
        req.form_user_field, req.form_pass_field
    ))
