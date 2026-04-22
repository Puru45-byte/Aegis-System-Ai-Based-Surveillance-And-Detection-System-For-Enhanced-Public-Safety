"""
WebSocket endpoint for live detection control
"""

from fastapi import WebSocket, WebSocketDisconnect, Query
from app.websockets.manager import manager
from app.api.deps import get_current_user
from app.models.user import User
from app.core.security import verify_token
import json

async def websocket_endpoint(websocket: WebSocket, token: str = Query(...)):
    """WebSocket endpoint for live detection control"""
    
    # Verify token
    try:
        payload = verify_token(token)
        if not payload:
            print("❌ WebSocket token verification failed: Invalid token")
            await websocket.close(code=4001, reason="Invalid token")
            return
            
        user_id = payload.get("sub")
        if not user_id:
            print("❌ WebSocket token verification failed: No user ID in token")
            await websocket.close(code=4001, reason="Invalid token")
            return
    except Exception as e:
        print(f"❌ WebSocket token verification failed: {e}")
        await websocket.close(code=4001, reason="Invalid token")
        return
    
    # Connect with user_id
    await manager.connect(websocket, user_id)
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message = json.loads(data)
            
            message_type = message.get("type")
            
            if message_type == "start_detection":
                await manager.start_live_detection(user_id)
                
            elif message_type == "stop_detection":
                await manager.stop_live_detection(user_id)
                
            elif message_type == "ping":
                # Keep connection alive
                await websocket.send_text(json.dumps({"type": "pong"}))
                
            elif message_type == "get_status":
                # Send current status
                await websocket.send_text(json.dumps({
                    "type": "status_response",
                    "active": manager.is_live_detection_active(),
                    "connected_users": manager.get_connected_users_count()
                }))
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
    except Exception as e:
        print(f"❌ WebSocket error for user {user_id}: {e}")
        manager.disconnect(websocket, user_id)
