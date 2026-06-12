import os

from fastapi import FastAPI
from .routers import prompts, ui, voice
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(prompts.router)
app.include_router(ui.router)
app.include_router(voice.router)

if os.getenv("ENABLE_TERMINATE_ENDPOINT", "false").lower() == "true":
    from .routers import terminate
    app.include_router(terminate.router)