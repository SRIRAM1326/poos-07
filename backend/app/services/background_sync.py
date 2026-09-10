import asyncio
import logging

from app.core.database import SessionLocal
from app.models import models
from app.services.github_service import (
    PERIODIC_SYNC_MIN_INTERVAL_SECONDS,
    should_auto_sync,
    sync_github_account,
)

logger = logging.getLogger(__name__)

_sync_lock = asyncio.Lock()


def _sync_all_connected_accounts() -> int:
    """Single-threaded pass over every connected GitHub account that is due for sync."""
    db = SessionLocal()
    synced = 0
    try:
        accounts = db.query(models.GitHubAccount).filter(
            models.GitHubAccount.is_connected.is_(True),
        ).all()
        for account in accounts:
            if not should_auto_sync(account, min_interval_seconds=PERIODIC_SYNC_MIN_INTERVAL_SECONDS):
                continue
            try:
                sync_github_account(db, account)
                synced += 1
            except Exception as exc:  # keep the loop alive on individual failures
                logger.warning("Periodic GitHub sync failed for account_id=%s: %s", account.id, exc)
    finally:
        db.close()
    return synced


async def periodic_github_sync_loop():
    """Background task: periodically resync GitHub statistics for all connected accounts.

    Syncs are blocking HTTP calls, so they run in the default thread executor to
    keep the event loop responsive. A lock prevents overlapping passes if a pass
    takes longer than the interval. This acts as a fallback so activity that never
    reaches a webhook (or arrives for repos without a PoOS Project) still shows up.
    """
    while True:
        await asyncio.sleep(PERIODIC_SYNC_MIN_INTERVAL_SECONDS)
        if _sync_lock.locked():
            continue
        async with _sync_lock:
            loop = asyncio.get_running_loop()
            synced = await loop.run_in_executor(None, _sync_all_connected_accounts)
            if synced:
                logger.info("Periodic GitHub sync refreshed %s account(s)", synced)