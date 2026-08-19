import asyncio
import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Request, Depends
from fastapi.responses import StreamingResponse
from app.core.websocket import manager

logger = logging.getLogger(__name__)
router = APIRouter()

from app.core.security import decode_access_token
from app.core.redis import is_token_blacklisted

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    token = websocket.query_params.get("token")

    # SECURITY FIX: Token wajib di production, opsional di development
    from app.core.config import settings
    if not token:
        if settings.fastapi_env == "production":
            await websocket.close(code=4001, reason="Token required")
            return
        user_identity = "dev_anonymous"
    else:
        payload = decode_access_token(token)
        if not payload or payload.get("type") != "access":
            await websocket.close(code=4003, reason="Token tidak valid atau telah kadaluarsa")
            return

        jti = payload.get("jti")
        if jti and is_token_blacklisted(jti):
            await websocket.close(code=4001, reason="Token telah di-revoke")
            return

        user_identity = payload.get("sub", "authenticated_user")

    # Capture running loop on manager if not yet set
    try:
        manager.set_loop(asyncio.get_running_loop())
    except Exception:
        pass

    await manager.connect(websocket)
    try:
        # Send initial welcome / connected status
        await websocket.send_text(json.dumps({
            "event": "CONNECTED",
            "data": {"status": "connected", "user": user_identity, "message": "Realtime notification channel active"}
        }))

        while True:
            # Keep connection alive, listen for client pings or messages
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("type") == "PING" or msg.get("event") == "PING":
                    await websocket.send_text(json.dumps({"event": "PONG", "data": {}}))
            except Exception:
                # Echo ping if plain text
                if data.strip().upper() == "PING":
                    await websocket.send_text(json.dumps({"event": "PONG", "data": {}}))
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

@router.get("/stream")
async def sse_event_stream(request: Request):
    """
    Server-Sent Events (SSE) fallback stream.
    """
    async def event_generator():
        yield f"data: {json.dumps({'event': 'CONNECTED', 'data': {'status': 'connected'}})}\n\n"
        while True:
            if await request.is_disconnected():
                break
            await asyncio.sleep(15)
            yield f": keepalive\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

from app.core.dependencies import RoleChecker
from app.models.users import UserRole, User

admin_or_owner = RoleChecker([UserRole.admin, UserRole.owner])

@router.get("/status")
async def get_realtime_status(
    current_user: User = Depends(admin_or_owner)
):
    return {
        "status": "online",
        "active_websocket_connections": len(manager.active_connections)
    }
