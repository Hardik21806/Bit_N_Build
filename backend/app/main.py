"""
app/main.py
Application entry point: FastAPI app, CORS, global exception handlers,
router registration, startup/shutdown hooks, and the escalation scheduler.
"""
import logging

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.config import get_settings
from app import database as db
from app.routers import incidents, resources, dashboard, analytics
from app.services import escalation_scheduler

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("app.main")

settings = get_settings()

app = FastAPI(
    title="Intelligent Emergency Response & Resource Coordination Platform",
    description="Backend API for PS-9: incident intake, AI classification, "
                 "duplicate detection, resource recommendation, real-time "
                 "monitoring, alerts, and analytics.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(incidents.router)
app.include_router(resources.router)
app.include_router(dashboard.router)
app.include_router(analytics.router)


# ---------- Global exception handlers ----------
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning("Validation error on %s: %s", request.url.path, exc.errors())
    return JSONResponse(
        status_code=422,
        content={"error": "Validation failed", "detail": exc.errors(), "status_code": 422},
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.warning("HTTPException on %s: %s", request.url.path, exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": "Request failed", "detail": str(exc.detail), "status_code": exc.status_code},
    )


@app.exception_handler(db.DBError)
async def db_error_handler(request: Request, exc: db.DBError):
    logger.error("Database error on %s: %s", request.url.path, exc)
    return JSONResponse(
        status_code=500,
        content={"error": "Database operation failed", "detail": str(exc), "status_code": 500},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception on %s", request.url.path)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc), "status_code": 500},
    )


# ---------- Lifecycle ----------
@app.on_event("startup")
async def on_startup():
    logger.info("Starting Emergency Response Platform backend...")
    if not db.check_connection():
        logger.error(
            "Supabase connection check FAILED at startup. The API will still "
            "run, but requests will fail until the database is reachable."
        )
    else:
        logger.info("Supabase connection OK.")
    escalation_scheduler.start_scheduler()


@app.on_event("shutdown")
async def on_shutdown():
    logger.info("Shutting down Emergency Response Platform backend...")
    escalation_scheduler.stop_scheduler()


# ---------- Health check ----------
@app.get("/health")
def health_check():
    db_ok = db.check_connection()
    return {
        "status": "ok" if db_ok else "degraded",
        "database_connected": db_ok,
    }


@app.get("/")
def root():
    return {
        "name": "Intelligent Emergency Response & Resource Coordination Platform API",
        "docs": "/docs",
        "health": "/health",
        "websocket": "/ws/dashboard",
    }
