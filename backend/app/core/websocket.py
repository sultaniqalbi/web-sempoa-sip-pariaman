import asyncio
import json
import logging
from typing import List, Dict, Any, Optional
from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self._loop: Optional[asyncio.AbstractEventLoop] = None

    def set_loop(self, loop: asyncio.AbstractEventLoop):
        self._loop = loop

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Total active connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket client disconnected. Remaining active connections: {len(self.active_connections)}")

    async def broadcast(self, event_type: str, data: Dict[str, Any]):
        """
        Broadcast JSON payload to all connected clients asynchronously.
        """
        if not self.active_connections:
            return

        payload = {
            "event": event_type,
            "data": data
        }
        message = json.dumps(payload, default=str)
        disconnected = []

        for connection in list(self.active_connections):
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.warning(f"Error sending message to WebSocket client: {e}")
                disconnected.append(connection)

        for conn in disconnected:
            self.disconnect(conn)

    def broadcast_sync(self, event_type: str, data: Dict[str, Any]):
        """
        Synchronous/thread-safe helper to schedule broadcast on the running event loop.
        """
        try:
            loop = self._loop
            if not loop or loop.is_closed():
                try:
                    loop = asyncio.get_event_loop()
                except RuntimeError:
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)

            if loop.is_running():
                asyncio.run_coroutine_threadsafe(self.broadcast(event_type, data), loop)
            else:
                loop.run_until_complete(self.broadcast(event_type, data))
        except Exception as e:
            logger.error(f"Failed to broadcast sync event {event_type}: {e}")

# Global singleton instance
manager = ConnectionManager()
