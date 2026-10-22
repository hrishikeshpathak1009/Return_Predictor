"""FastAPI application for Product Return Prediction."""
from contextlib import asynccontextmanager
import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from model import get_bundle, predict
from schemas import (
    FeatureImportanceItem,
    MetricItem,
    ModelInfoResponse,
    OrderInput,
    PredictionResponse,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Fail fast if the artifact is missing or cannot be deserialized.
    get_bundle()
    print("[OK] Model loaded successfully")
    yield


app = FastAPI(
    title="Product Return Prediction API",
    description="Predict whether an e-commerce order will be returned.",
    version="1.0.0",
    lifespan=lifespan,
)

origins = [
    origin.strip()
    for origin in os.getenv("FRONTEND_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://returnpredictor-two.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"service": "Product Return Prediction API", "docs": "/docs"}


@app.get("/health")
def health():
    try:
        bundle = get_bundle()
        return {"status": "ok", "model_loaded": bundle is not None}
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Model unavailable: {exc}")


@app.get("/model-info", response_model=ModelInfoResponse)
def model_info():
    try:
        bundle = get_bundle()
        metrics = [
            MetricItem(name=str(k), value=round(float(v), 4))
            for k, v in bundle.get("metrics", {}).items()
        ]
        feature_importance = [
            FeatureImportanceItem(
                feature=str(item["feature"]),
                importance=float(item["importance"]),
            )
            for item in bundle.get("feature_importance", [])
        ]
        return ModelInfoResponse(
            model_name=str(bundle["model_name"]),
            metrics=metrics,
            feature_importance=feature_importance,
            threshold=float(bundle.get("threshold", 0.5)),
        )
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Model metadata unavailable: {exc}")


@app.post("/predict", response_model=PredictionResponse)
def predict_return(order: OrderInput):
    try:
        return PredictionResponse(**predict(order.model_dump()))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}")
