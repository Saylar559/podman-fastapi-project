from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'a2bbdc430ef6'
down_revision: Union[str, None] = '6a6435522bb9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Добавляем новое значение в ENUM userrole
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'developer'")


def downgrade() -> None:
    # ⚠️ В PostgreSQL удалить значение из ENUM напрямую нельзя.
    # Чтобы откатить, нужно пересоздать тип без 'developer'.
    # Для простоты оставляем downgrade пустым.
    pass
