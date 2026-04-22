"""
WebSocket Connection Manager for Live Detection Control
"""

from typing import List, Dict
from fastapi import WebSocket
import json

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.live_detection_active: bool = False
        self.live_detection_users: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections.append(websocket)
        self.live_detection_users[user_id] = websocket
        print(f"🔗 User {user_id} connected for live detection")

    def disconnect(self, websocket: WebSocket, user_id: str):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if user_id in self.live_detection_users:
            del self.live_detection_users[user_id]
        print(f"🔌 User {user_id} disconnected from live detection")
        
        # If no users connected, stop live detection
        if len(self.live_detection_users) == 0:
            self.live_detection_active = False
            print("🛑 No users connected - stopping live detection")

    async def start_live_detection(self, user_id: str):
        self.live_detection_active = True
        print(f"▶️ Live detection started by user {user_id}")
        
        # Notify all connected users
        await self.broadcast({
            "type": "detection_status",
            "active": True,
            "started_by": user_id
        })

    async def stop_live_detection(self, user_id: str):
        self.live_detection_active = False
        print(f"⏹️ Live detection stopped by user {user_id}")
        
        # Notify all connected users
        await self.broadcast({
            "type": "detection_status", 
            "active": False,
            "stopped_by": user_id
        })

    async def broadcast(self, message: dict):
        """Broadcast message to all connected users"""
        if self.active_connections:
            disconnected = []
            for connection in self.active_connections:
                try:
                    await connection.send_text(json.dumps(message))
                except:
                    disconnected.append(connection)
            
            # Remove disconnected connections
            for conn in disconnected:
                self.active_connections.remove(conn)

    def is_live_detection_active(self) -> bool:
        """Check if live detection is currently active"""
        return self.live_detection_active

    def get_connected_users_count(self) -> int:
        """Get number of connected users"""
        return len(self.live_detection_users)

# Global instance
manager = ConnectionManager()