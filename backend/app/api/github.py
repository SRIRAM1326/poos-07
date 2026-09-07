from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import models
from app.services.github_service import (
    GITHUB_SCOPES,
    SCORE_WEIGHTS,
    fetch_recent_activity,
    sync_github_account,
)

router = APIRouter(prefix="/github", tags=["GitHub Integration"])


def _account_or_404(db: Session, current_user: models.User) -> models.GitHubAccount:
    account = db.query(models.GitHubAccount).filter(
        models.GitHubAccount.user_id == current_user.id,
        models.GitHubAccount.is_connected.is_(True),
    ).first()
    if account is None:
        raise HTTPException(status_code=404, detail="No GitHub account is connected.")
    return account


def _account_public(account: models.GitHubAccount) -> dict:
    return {
        "id": account.id,
        "github_id": account.github_id,
        "login": account.login,
        "name": account.name,
        "avatar_url": account.avatar_url,
        "bio": account.bio,
        "email": account.email,
        "html_url": account.html_url,
        "scope": account.scope,
    }


@router.get("/status")
def github_status(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    account = db.query(models.GitHubAccount).filter(models.GitHubAccount.user_id == current_user.id).first()
    if account is None or not account.is_connected:
        return {
            "connected": False,
            "account": None,
            "required_scopes": GITHUB_SCOPES,
        }
    return {
        "connected": True,
        "account": _account_public(account),
        "required_scopes": GITHUB_SCOPES,
        "last_sync_at": account.last_sync_at.isoformat() if account.last_sync_at else None,
        "last_sync_error": account.last_sync_error,
        "statistics_json": account.statistics_json,
    }


@router.get("/profile")
def github_profile(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    account = _account_or_404(db, current_user)
    return _account_public(account)


@router.get("/repositories")
def github_repositories(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    account = _account_or_404(db, current_user)
    repos = db.query(models.GitHubRepository).filter(
        models.GitHubRepository.account_id == account.id,
    ).order_by(models.GitHubRepository.repo_pushed_at.desc().nulls_last()).limit(200).all()
    return {
        "account_id": account.id,
        "count": len(repos),
        "repositories": [
            {
                "github_repo_id": repo.github_repo_id,
                "name": repo.name,
                "full_name": repo.full_name,
                "description": repo.description,
                "html_url": repo.html_url,
                "default_branch": repo.default_branch,
                "visibility": repo.visibility,
                "owner_login": repo.owner_login,
                "languages": repo.languages_json or {},
                "topics": repo.topics_json or [],
                "stargazers_count": repo.stargazers_count,
                "forks_count": repo.forks_count,
                "is_fork": repo.is_fork,
                "created_at": repo.repo_created_at.isoformat() if repo.repo_created_at else None,
                "updated_at": repo.repo_updated_at.isoformat() if repo.repo_updated_at else None,
                "pushed_at": repo.repo_pushed_at.isoformat() if repo.repo_pushed_at else None,
                "statistics": repo.statistics_json or {},
            }
            for repo in repos
        ],
    }


@router.get("/statistics")
def github_statistics(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    account = _account_or_404(db, current_user)
    repos = db.query(models.GitHubRepository).filter(
        models.GitHubRepository.account_id == account.id,
    ).order_by(models.GitHubRepository.repo_pushed_at.desc().nulls_last()).all()
    totals = account.statistics_json or {}
    return {
        "login": account.login,
        "avatar_url": account.avatar_url,
        "html_url": account.html_url,
        "contribution_score": int(totals.get("contribution_score", 0) or 0),
        "score_weights": SCORE_WEIGHTS,
        "totals": totals,
        "per_repository": [
            {
                "full_name": repo.full_name,
                "html_url": repo.html_url,
                "pushed_at": repo.repo_pushed_at.isoformat() if repo.repo_pushed_at else None,
                "statistics": repo.statistics_json or {},
            }
            for repo in repos
            if (repo.statistics_json or {}).get("commits")
        ],
        "last_sync_at": account.last_sync_at.isoformat() if account.last_sync_at else None,
        "last_sync_error": account.last_sync_error,
    }


@router.get("/activity")
def github_activity(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    account = _account_or_404(db, current_user)
    return fetch_recent_activity(db, account)


@router.post("/sync")
def github_sync(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    account = _account_or_404(db, current_user)
    account = sync_github_account(db, account)
    db.refresh(account)
    return {
        "status": "completed" if not account.last_sync_error else "failed",
        "last_sync_at": account.last_sync_at.isoformat() if account.last_sync_at else None,
        "last_sync_error": account.last_sync_error,
        "statistics_json": account.statistics_json,
    }


@router.delete("/connection")
def github_disconnect(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    account = db.query(models.GitHubAccount).filter(models.GitHubAccount.user_id == current_user.id).first()
    if account is None:
        raise HTTPException(status_code=404, detail="No GitHub account is connected.")
    db.delete(account)
    db.commit()
    return {"status": "disconnected"}