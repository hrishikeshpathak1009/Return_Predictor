"""Model loading, preprocessing, and prediction logic."""
from __future__ import annotations

import os
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

ARTIFACT_PATH = Path(__file__).resolve().parent / "artifacts" / "model_data.joblib"
_bundle: dict | None = None


def _load_bundle() -> dict:
    global _bundle
    if _bundle is None:
        if not ARTIFACT_PATH.exists():
            raise FileNotFoundError(
                f"Model artifact not found at {ARTIFACT_PATH}. "
                "Copy model_data.joblib into backend/artifacts/."
            )
        _bundle = joblib.load(ARTIFACT_PATH)
    return _bundle


def get_bundle() -> dict:
    return _load_bundle()


def add_features(row: dict) -> dict:
    """Mirror the feature engineering in Return_predictor.ipynb."""
    d = dict(row)
    d["total_support_contacts"] = (
        float(d["customer_support_calls"]) + float(d["chat_interactions"])
    )
    d.pop("customer_support_calls", None)
    d.pop("chat_interactions", None)
    d["log_price"] = np.log1p(float(d["product_price"]))
    d.pop("product_price", None)
    return d


def preprocess(order: dict) -> pd.DataFrame:
    bundle = _load_bundle()
    scaler = bundle["scaler"]
    model_columns = bundle["model_columns"]
    numeric_features = list(bundle["numeric_features"])
    binary_flags = list(bundle["binary_flags"])
    categorical_features = list(bundle["categorical_features"])
    train_medians = bundle["train_medians"]

    df = pd.DataFrame([add_features(order)])

    if "fulfillment_type" in df.columns:
        df["fulfillment_type"] = (
            df["fulfillment_type"].astype("string").str.strip().str.title()
        )

    # Ensure all numeric/binary columns expected by the artifact exist, then impute.
    for col in numeric_features + binary_flags:
        if col not in df.columns:
            df[col] = train_medians.get(col, 0)
        else:
            value = df[col].iloc[0]
            if pd.isna(value):
                df[col] = train_medians.get(col, 0)

    # The training notebook fitted StandardScaler on these numeric columns.
    df[numeric_features] = scaler.transform(df[numeric_features])

    # Ensure categorical fields exist before one-hot encoding.
    for col in categorical_features:
        if col not in df.columns:
            df[col] = ""

    df = pd.get_dummies(df, columns=categorical_features, dtype=int)
    df = df.reindex(columns=model_columns, fill_value=0)
    return df


def predict(order: dict) -> dict:
    bundle = _load_bundle()
    model = bundle["model"]
    threshold = float(bundle.get("threshold", 0.5))

    X = preprocess(order)
    probabilities = model.predict_proba(X)
    classes = list(model.classes_)
    positive_index = classes.index(1) if 1 in classes else classes.index(True)
    proba = float(probabilities[0, positive_index])
    predicted = proba >= threshold

    if proba < 0.3:
        risk = "Low"
    elif proba < 0.6:
        risk = "Medium"
    else:
        risk = "High"

    return {
        "return_probability": round(proba, 4),
        "predicted_returned": bool(predicted),
        "risk_level": risk,
    }
