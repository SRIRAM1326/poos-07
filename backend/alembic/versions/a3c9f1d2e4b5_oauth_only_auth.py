"""OAuth-only authentication

Revision ID: a3c9f1d2e4b5
Revises: 47f8ba7150fa
Create Date: 2026-09-07 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a3c9f1d2e4b5'
down_revision: Union[str, Sequence[str], None] = '47f8ba7150fa'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Remove email/password authentication and add OAuth identity fields."""
    # Rename the state table so both GitHub and Google login flows reuse it.
    op.execute("ALTER TABLE IF EXISTS github_oauth_states RENAME TO oauth_states;")

    op.add_column('users', sa.Column('username', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('oauth_provider', sa.String(length=50), nullable=True))
    op.add_column('users', sa.Column('oauth_provider_uid', sa.String(length=255), nullable=True))
    op.execute("CREATE INDEX IF NOT EXISTS ix_users_oauth_provider ON users (oauth_provider);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_users_oauth_provider_uid ON users (oauth_provider_uid);")

    # Email is optional because GitHub may not expose one; passwords are gone.
    op.alter_column('users', 'email', existing_type=sa.String(length=255), nullable=True)
    op.drop_column('users', 'hashed_password')

    # OAuth state now works for anonymous login sessions (user_id may be NULL),
    # and stores the intended role + provider.
    op.alter_column('oauth_states', 'user_id', existing_type=sa.Integer(), nullable=True)
    op.add_column('oauth_states', sa.Column('role', sa.String(length=50), nullable=True))
    op.add_column('oauth_states', sa.Column('provider', sa.String(length=20), nullable=True, server_default='github'))


def downgrade() -> None:
    """Restore email/password authentication."""
    op.drop_column('users', 'username')
    op.drop_column('users', 'oauth_provider_uid')
    op.drop_column('users', 'oauth_provider')
    op.add_column('users', sa.Column('hashed_password', sa.String(length=255), nullable=False))
    op.alter_column('users', 'email', existing_type=sa.String(length=255), nullable=False)

    op.drop_column('oauth_states', 'provider')
    op.drop_column('oauth_states', 'role')
    op.execute("ALTER TABLE IF EXISTS oauth_states RENAME TO github_oauth_states;")