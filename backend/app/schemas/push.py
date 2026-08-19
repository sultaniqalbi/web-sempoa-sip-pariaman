from pydantic import BaseModel
from typing import Optional

class PushSubscriptionKeys(BaseModel):
    p256dh: str
    auth: str

class PushSubscribeRequest(BaseModel):
    endpoint: str
    keys: PushSubscriptionKeys
    device_info: Optional[str] = None

class PushUnsubscribeRequest(BaseModel):
    endpoint: str

class VapidKeyResponse(BaseModel):
    public_key: str
