import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from config import PORT
from routers import recon, webexploit, network, password, osint


@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"READY:{PORT}", flush=True)
    sys.stdout.flush()
    yield


app = FastAPI(title="Nexus Security Toolkit", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(recon.router)
app.include_router(webexploit.router)
app.include_router(network.router)
app.include_router(password.router)
app.include_router(osint.router)


@app.get("/health")
async def health():
    return {"status": "ok", "port": PORT}


if __name__ == "__main__":
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=PORT,
        log_level="warning",
    )
