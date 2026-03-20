from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from app.core.config import settings
from app.core.database import init_db
from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.jobs import router as jobs_router
from app.api.payments import router as payments_router
from app.api.reviews import router as reviews_router
from app.api.messages import router as messages_router
from app.api.notifications import router as notifications_router
from app.api.admin import router as admin_router
from app.api.websocket import websocket_endpoint

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up...")
    try:
        await init_db()
        logger.info("Database initialized")
    except Exception as e:
        logger.error(f"Startup error: {e}")
        raise
    yield
    logger.info("Shutting down...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix=settings.API_PREFIX)
app.include_router(users_router, prefix=settings.API_PREFIX)
app.include_router(jobs_router, prefix=settings.API_PREFIX)
app.include_router(payments_router, prefix=settings.API_PREFIX)
app.include_router(reviews_router, prefix=settings.API_PREFIX)
app.include_router(messages_router, prefix=settings.API_PREFIX)
app.include_router(notifications_router, prefix=settings.API_PREFIX)
app.include_router(admin_router, prefix=settings.API_PREFIX)

@app.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket):
    try:
        token = websocket.query_params.get("token")
        await websocket.accept()
        await websocket_endpoint(websocket, token)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")

@app.websocket("/ws/test")
async def websocket_test(websocket: WebSocket):
    await websocket.accept()
    logger.info("Test WebSocket connected")
    try:
        await websocket.send_text("Hello! This is a test connection.")
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"Echo: {data}")
    except WebSocketDisconnect:
        logger.info("Test WebSocket disconnected")

@app.get("/")
async def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "running"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/ws-test")
async def ws_test():
    return {"message": "WebSocket endpoint exists at /ws/chat"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
