from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ..pricing import PricingError, calculate_price

router = APIRouter(prefix="/api/price", tags=["price"])


class PriceIn(BaseModel):
    materials: float = Field(ge=0)
    hours: float = Field(ge=0)
    rate: float = Field(ge=0)
    ngo: float = Field(ge=0)
    shipping: float = Field(ge=0)
    fee: float = Field(ge=0)


@router.post("/calc")
def calc(body: PriceIn):
    try:
        return calculate_price(**body.model_dump()).as_json()
    except PricingError as e:
        raise HTTPException(422, str(e)) from None
