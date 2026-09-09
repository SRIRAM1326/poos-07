"""Add github sync logs table and extended GitHub profile fields.

Revision ID: b4d8e1f3a6c7
Revises: a3c9f1d2e4b5
Create Date: 2026-09-09 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b4d8e1f3a6c7'
down_revision: Union[str, Sequence[str], None] = 'a3c9f1d2e4b5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add extended GitHub profile fields and sync logs table."""
    # New columns on github_accounts for richer profile data
    op.add_column('github_accounts', sa.Column('company', sa.String(length=255), nullable=True))
    op.add_column('github_accounts', sa.Column('location', sa.String(length=255), nullable=True))
    op.add_column('github_accounts', sa.Column('blog', sa.String(length=500), nullable=True))
    op.add_column('github_accounts', sa.Column('followers', sa.Integer(), server_default='0'))
    op.add_column('github_accounts', sa.Column('following', sa.Integer(), server_default='0'))
    op.add_column('github_accounts', sa.Column('public_repos', sa.Integer(), server_default='0'))
    op.add_column('github_accounts', sa.Column('account_created_at', sa.DateTime(), nullable=True))
    op.add_column('github_accounts', sa.Column('languages_json', sa.JSON(), nullable=True))

    # New columns on github_repositories for richer repo data
    op.add_column('github_repositories', sa.Column('primary_language', sa.String(length=100), nullable=True))
    op.add_column('github_repositories', sa.Column('size', sa.Integer(), server_default='0'))
    op.add_column('github_repositories', sa.Column('open_issues_count', sa.Integer(), server_default='0'))
    op.add_column('github_repositories', sa.Column('license_name', sa.String(length=100), nullable=True))
    op.add_column('github_repositories', sa.Column('archived', sa.Boolean(), server_default='false'))

    # Sync logs table for audit trail
    op.create_table(
        'github_sync_logs',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('account_id', sa.Integer(), sa.ForeignKey('github_accounts.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='success'),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('rate_limit_remaining', sa.Integer(), nullable=True),
        sa.Column('rate_limit_reset_at', sa.DateTime(), nullable=True),
        sa.Column('duration_ms', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )


def downgrade() -> None:
    """Remove sync logs table and extended columns."""
    op.drop_table('github_sync_logs')
    op.drop_column('github_repositories', 'archived')
    op.drop_column('github_repositories', 'license_name')
    op.drop_column('github_repositories', 'open_issues_count')
    op.drop_column('github_repositories', 'size')
    op.drop_column('github_repositories', 'primary_language')
    op.drop_column('github_accounts', 'languages_json')
    op.drop_column('github_accounts', 'account_created_at')
    op.drop_column('github_accounts', 'public_repos')
    op.drop_column('github_accounts', 'following')
    op.drop_column('github_accounts', 'followers')
    op.drop_column('github_accounts', 'blog')
    op.drop_column('github_accounts', 'location')
    op.drop_column('github_accounts', 'company')
