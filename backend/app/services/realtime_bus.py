import asyncio
import json
import uuid
from typing import Any, Dict, Optional
from app.core.logging_config import get_logger

logger = get_logger("app.realtime_bus")
_WORKER_ID = str(uuid.uuid4())
_CHANNEL = "ws:events:broadcast"


class RealtimeBus:
    def __init__(self) -> None:
        self._listener_task: Optional[asyncio.Task] = None
        self._running = False

    async def publish(
        self,
        event_type: str,
        message: Dict[str, Any],
        target_id: Optional[str] = None,
        target_role: Optional[str] = None,
        tenant_id: Optional[str] = None,
    ) -> None:
        """Publish real-time event to distributed Redis PubSub channel."""
        try:
            from app.db.redis import get_redis

            r = get_redis()
            if not hasattr(r, "publish"):
                return
            payload = json.dumps(
                {
                    "origin_worker": _WORKER_ID,
                    "event_type": event_type,
                    "target_id": target_id,
                    "target_role": target_role,
                    "tenant_id": tenant_id,
                    "message": message,
                }
            )
            await r.publish(_CHANNEL, payload)
        except Exception as e:
            logger.debug("Realtime bus publish skipped/failed: %s", e)

    def start_listener(self, manager: Any) -> None:
        if self._listener_task is None:
            self._running = True
            self._listener_task = asyncio.create_task(self._listen_loop(manager))

    def stop_listener(self) -> None:
        self._running = False
        if self._listener_task is not None:
            self._listener_task.cancel()
            self._listener_task = None

    async def _listen_loop(self, manager: Any) -> None:
        while self._running:
            try:
                from app.db.redis import get_redis

                r = get_redis()
                if not hasattr(r, "pubsub"):
                    break
                pubsub = r.pubsub()
                await pubsub.subscribe(_CHANNEL)
                logger.info("Realtime bus subscribed to channel %s (worker: %s)", _CHANNEL, _WORKER_ID[:8])

                while self._running:
                    msg = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                    if not msg or msg.get("type") != "message":
                        await asyncio.sleep(0.05)
                        continue

                    data_str = msg.get("data")
                    if not data_str:
                        continue

                    try:
                        data = json.loads(data_str)
                    except Exception:
                        continue

                    # Ignore events that originated from this exact worker process
                    if data.get("origin_worker") == _WORKER_ID:
                        continue

                    event_type = data.get("event_type")
                    payload = data.get("message", {})
                    target_id = data.get("target_id")
                    target_role = data.get("target_role")
                    tenant_id = data.get("tenant_id")

                    if event_type == "personal" and target_id:
                        await manager.deliver_personal_message(payload, target_id)
                    elif event_type == "broadcast":
                        await manager.deliver_broadcast(payload, target_role, tenant_id=tenant_id)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.warning("Realtime bus listener reconnecting in 2s: %s", e)
                await asyncio.sleep(2.0)


realtime_bus = RealtimeBus()
