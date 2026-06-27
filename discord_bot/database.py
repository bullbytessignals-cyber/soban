import aiosqlite
from discord_bot.config import DB_FILE


async def init_db() -> None:
    async with aiosqlite.connect(DB_FILE) as db:
        await db.execute('PRAGMA journal_mode=WAL')
        await db.executescript('''
            CREATE TABLE IF NOT EXISTS balances (
                guild_id TEXT, user_id TEXT, balance REAL,
                PRIMARY KEY (guild_id, user_id)
            );
            CREATE TABLE IF NOT EXISTS invites (
                guild_id TEXT, user_id TEXT, invite_count INTEGER,
                PRIMARY KEY (guild_id, user_id)
            );
            CREATE TABLE IF NOT EXISTS user_invites (
                guild_id TEXT, user_id TEXT, invite_code TEXT,
                PRIMARY KEY (guild_id, user_id)
            );
            CREATE TABLE IF NOT EXISTS affiliates (
                guild_id TEXT, user_id TEXT, active INTEGER,
                PRIMARY KEY (guild_id, user_id)
            );
            CREATE TABLE IF NOT EXISTS invited_members (
                guild_id TEXT, member_id TEXT, inviter_id TEXT,
                PRIMARY KEY (guild_id, member_id)
            );
            CREATE TABLE IF NOT EXISTS channels (
                guild_id TEXT, user_id TEXT, channel_id TEXT,
                PRIMARY KEY (guild_id, user_id)
            );
            CREATE TABLE IF NOT EXISTS role_purchases (
                guild_id TEXT, member_id TEXT, role_id TEXT, purchase_time INTEGER,
                PRIMARY KEY (guild_id, member_id, role_id)
            );
        ''')
        await db.commit()


async def get_balance(guild_id: str, user_id: str) -> float:
    async with aiosqlite.connect(DB_FILE) as db:
        async with db.execute(
            'SELECT balance FROM balances WHERE guild_id=? AND user_id=?',
            (guild_id, user_id)
        ) as cur:
            row = await cur.fetchone()
            return row[0] if row else 0.0


async def update_balance(guild_id: str, user_id: str, balance: float) -> None:
    async with aiosqlite.connect(DB_FILE) as db:
        await db.execute(
            'INSERT OR REPLACE INTO balances (guild_id, user_id, balance) VALUES (?,?,?)',
            (guild_id, user_id, balance)
        )
        await db.commit()


async def get_invites(guild_id: str, user_id: str) -> int:
    async with aiosqlite.connect(DB_FILE) as db:
        async with db.execute(
            'SELECT invite_count FROM invites WHERE guild_id=? AND user_id=?',
            (guild_id, user_id)
        ) as cur:
            row = await cur.fetchone()
            return row[0] if row else 0


async def update_invites(guild_id: str, user_id: str, invite_count: int) -> None:
    async with aiosqlite.connect(DB_FILE) as db:
        await db.execute(
            'INSERT OR REPLACE INTO invites (guild_id, user_id, invite_count) VALUES (?,?,?)',
            (guild_id, user_id, invite_count)
        )
        await db.commit()


async def get_user_invite(guild_id: str, user_id: str) -> str | None:
    async with aiosqlite.connect(DB_FILE) as db:
        async with db.execute(
            'SELECT invite_code FROM user_invites WHERE guild_id=? AND user_id=?',
            (guild_id, user_id)
        ) as cur:
            row = await cur.fetchone()
            return row[0] if row else None


async def update_user_invite(guild_id: str, user_id: str, invite_code: str) -> None:
    async with aiosqlite.connect(DB_FILE) as db:
        await db.execute(
            'INSERT OR REPLACE INTO user_invites (guild_id, user_id, invite_code) VALUES (?,?,?)',
            (guild_id, user_id, invite_code)
        )
        await db.commit()


async def is_affiliate(guild_id: str, user_id: str) -> bool:
    async with aiosqlite.connect(DB_FILE) as db:
        async with db.execute(
            'SELECT active FROM affiliates WHERE guild_id=? AND user_id=?',
            (guild_id, user_id)
        ) as cur:
            row = await cur.fetchone()
            return bool(row[0]) if row else False


async def update_affiliate(guild_id: str, user_id: str, active: int) -> None:
    async with aiosqlite.connect(DB_FILE) as db:
        await db.execute(
            'INSERT OR REPLACE INTO affiliates (guild_id, user_id, active) VALUES (?,?,?)',
            (guild_id, user_id, active)
        )
        await db.commit()


async def get_inviter(guild_id: str, member_id: str) -> str | None:
    async with aiosqlite.connect(DB_FILE) as db:
        async with db.execute(
            'SELECT inviter_id FROM invited_members WHERE guild_id=? AND member_id=?',
            (guild_id, member_id)
        ) as cur:
            row = await cur.fetchone()
            return row[0] if row else None


async def update_invited_member(guild_id: str, member_id: str, inviter_id: str | None) -> None:
    async with aiosqlite.connect(DB_FILE) as db:
        await db.execute(
            'INSERT OR REPLACE INTO invited_members (guild_id, member_id, inviter_id) VALUES (?,?,?)',
            (guild_id, member_id, inviter_id)
        )
        await db.commit()


async def get_channel(guild_id: str, user_id: str) -> str | None:
    async with aiosqlite.connect(DB_FILE) as db:
        async with db.execute(
            'SELECT channel_id FROM channels WHERE guild_id=? AND user_id=?',
            (guild_id, user_id)
        ) as cur:
            row = await cur.fetchone()
            return row[0] if row else None


async def update_channel(guild_id: str, user_id: str, channel_id: str) -> None:
    async with aiosqlite.connect(DB_FILE) as db:
        await db.execute(
            'INSERT OR REPLACE INTO channels (guild_id, user_id, channel_id) VALUES (?,?,?)',
            (guild_id, user_id, channel_id)
        )
        await db.commit()


async def record_role_purchase(guild_id: str, member_id: str, role_id: str, purchase_time: int) -> None:
    async with aiosqlite.connect(DB_FILE) as db:
        await db.execute(
            'INSERT OR REPLACE INTO role_purchases (guild_id, member_id, role_id, purchase_time) VALUES (?,?,?,?)',
            (guild_id, member_id, role_id, purchase_time)
        )
        await db.commit()


async def get_role_purchases(guild_id: str, member_id: str) -> list[tuple]:
    async with aiosqlite.connect(DB_FILE) as db:
        async with db.execute(
            'SELECT role_id, purchase_time FROM role_purchases WHERE guild_id=? AND member_id=?',
            (guild_id, member_id)
        ) as cur:
            return await cur.fetchall()


async def get_all_balances(guild_id: str) -> list[tuple]:
    async with aiosqlite.connect(DB_FILE) as db:
        async with db.execute(
            'SELECT user_id, balance FROM balances WHERE guild_id=?', (guild_id,)
        ) as cur:
            return await cur.fetchall()


async def get_top_inviters(guild_id: str, limit: int = 5) -> list[tuple]:
    async with aiosqlite.connect(DB_FILE) as db:
        async with db.execute(
            'SELECT user_id, invite_count FROM invites WHERE guild_id=? ORDER BY invite_count DESC LIMIT ?',
            (guild_id, limit)
        ) as cur:
            return await cur.fetchall()


async def get_all_user_invites(guild_id: str) -> list[tuple]:
    async with aiosqlite.connect(DB_FILE) as db:
        async with db.execute(
            'SELECT user_id, invite_code FROM user_invites WHERE guild_id=?', (guild_id,)
        ) as cur:
            return await cur.fetchall()


async def get_all_role_purchases(guild_id: str) -> list[tuple]:
    async with aiosqlite.connect(DB_FILE) as db:
        async with db.execute(
            'SELECT member_id, role_id, purchase_time FROM role_purchases WHERE guild_id=?', (guild_id,)
        ) as cur:
            return await cur.fetchall()


async def delete_affiliate_data(guild_id: str, user_id: str) -> None:
    async with aiosqlite.connect(DB_FILE) as db:
        for table, col in [
            ('channels', 'user_id'),
            ('user_invites', 'user_id'),
            ('invites', 'user_id'),
            ('affiliates', 'user_id'),
        ]:
            await db.execute(
                f'DELETE FROM {table} WHERE guild_id=? AND {col}=?',
                (guild_id, user_id)
            )
        await db.commit()
