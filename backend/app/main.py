from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers.prompts import router as prompt_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True
)

app.include_router(prompt_router)