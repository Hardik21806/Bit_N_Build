"""
app/websocket_manager.py
Manages active WebSocket connections for the real-time dashboard and
broadcasts incident/alert/resource updates to all connected clients.
"""
import json
import logging
from typing import Any, Dict, List

from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger("app.websocket_manager")


class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info("WebSocket connected. Total connections: %s", len(self.active_connections))

    def disconnect(self, websocket: WebSocket) -> None:
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        logger.info("WebSocket disconnected. Total connections: %s", len(self.active_connections))

    async def broadcast(self, event_type: str, payload: Dict[str, Any]) -> None:
        """Sends a JSON message to every connected client. Dead connections
        are removed automatically instead of raising."""
        message = json.dumps({"event": event_type, "data": payload}, default=str)
        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:  # noqa: BLE001
                logger.warning("Dropping dead WebSocket connection")
                dead_connections.append(connection)
        for conn in dead_connections:
            self.disconnect(conn)


manager = ConnectionManager()


async def handle_dashboard_socket(websocket: WebSocket) -> None:
    await manager.connect(websocket)
    try:
        while True:
            # We don't require inbound messages, but we must keep receiving
            # to detect disconnects; ping/keepalive messages are ignored.
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:  # noqa: BLE001
        logger.exception("Unexpected WebSocket error")
        manager.disconnect(websocket)
