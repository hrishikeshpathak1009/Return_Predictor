from typing import Literal
from pydantic import BaseModel, ConfigDict, Field


class OrderInput(BaseModel):
    """Raw order fields expected by the training notebook."""
    model_config = ConfigDict(extra="forbid")

    product_category: str = Field(min_length=1)
    sub_category: str = Field(min_length=1)
    brand: str = Field(min_length=1)
    product_price: float = Field(gt=0)
    discount_percent: float = Field(ge=0, le=100)
    product_rating: float | None = Field(default=None, ge=0, le=5)
    review_count: float | None = Field(default=None, ge=0)
    fragile_item: int = Field(ge=0, le=1)
    warranty_available: int = Field(ge=0, le=1)
    product_return_rate: float = Field(ge=0, le=1)
    category_return_rate: float = Field(ge=0, le=1)
    brand_return_rate: float = Field(ge=0, le=1)
    defect_rate: float = Field(ge=0, le=1)
    seller_rating: float | None = Field(default=None, ge=0, le=5)
    seller_return_rate: float = Field(ge=0, le=1)
    fulfillment_type: str = Field(min_length=1)
    payment_method: str = Field(min_length=1)
    quantity: int = Field(ge=1)
    shipping_distance_km: float | None = Field(default=None, ge=0)
    delayed_delivery: int = Field(ge=0, le=1)
    wishlist_before_purchase: int = Field(ge=0, le=1)
    product_page_views: int = Field(ge=0)
    customer_support_calls: int = Field(ge=0)
    chat_interactions: int = Field(ge=0)


class PredictionResponse(BaseModel):
    return_probability: float
    predicted_returned: bool
    risk_level: Literal["Low", "Medium", "High"]


class MetricItem(BaseModel):
    name: str
    value: float


class FeatureImportanceItem(BaseModel):
    feature: str
    importance: float


class ModelInfoResponse(BaseModel):
    model_name: str
    metrics: list[MetricItem]
    feature_importance: list[FeatureImportanceItem]
    threshold: float
