"""
Soban Discord Affiliate Bot — single-file edition
"""

import asyncio
import datetime
import logging
import os
import random
import time

import aiosqlite
import discord
import psutil
from discord.ext import commands, tasks

# ---------------------------------------------------------------------------
# Pakistan Standard Time logging
# ---------------------------------------------------------------------------
logging.Formatter.converter = lambda *args: (
    datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=5))).timetuple()
)
logging.basicConfig(
    filename='bot.log',
    level=logging.INFO,
    format='%(asctime)s:%(levelname)s:%(name)s:%(message)s',
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Config — edit these values
# ---------------------------------------------------------------------------
BOT_TOKEN            = 'YOUR_BOT_TOKEN_HERE'   # <-- apna token yahan daalo

GUILD_ID             = 1348248729878134885
CHALLENGE_CHANNEL_ID = 1388256520541700176
LOG_CHANNEL_ID       = 1388138273834012682
CATEGORY_ID          = 1428941254544064522
ADMIN_ROLE_ID        = 1376921339994181734
FULL_ACCESS_ROLE_ID  = 1401364349905276990
AFFILIATER_ROLE_ID   = 1404007129593020520

PREMIUM_ROLE_PRICES: dict[int, float] = {
    1404040571018023024: 8.0,    # premium
    1387177079270805645: 35.0,   # elite
}

DB_FILE          = 'bot_data.db'
COOLDOWN_SECONDS = 5

# ---------------------------------------------------------------------------
# Database helpers (fully async via aiosqlite)
# ---------------------------------------------------------------------------

async def init_db() -> None:
    async with aiosqlite.connect(DB_FILE) as db:
        await db.execute('PRAGMA journal_mode=WAL')
        await db.executescript('''
            CREATE TABLE IF NOT EXISTS balances (
                guild_id TEXT, user_id TEXT, balance REAL,
                PRIMARY KEY (guild_id, user_id));
            CREATE TABLE IF NOT EXISTS invites (
                guild_id TEXT, user_id TEXT, invite_count INTEGER,
                PRIMARY KEY (guild_id, user_id));
            CREATE TABLE IF NOT EXISTS user_invites (
                guild_id TEXT, user_id TEXT, invite_code TEXT,
                PRIMARY KEY (guild_id, user_id));
            CREATE TABLE IF NOT EXISTS affiliates (
                guild_id TEXT, user_id TEXT, active INTEGER,
                PRIMARY KEY (guild_id, user_id));
            CREATE TABLE IF NOT EXISTS invited_members (
                guild_id TEXT, member_id TEXT, inviter_id TEXT,
                PRIMARY KEY (guild_id, member_id));
            CREATE TABLE IF NOT EXISTS channels (
                guild_id TEXT, user_id TEXT, channel_id TEXT,
                PRIMARY KEY (guild_id, user_id));
            CREATE TABLE IF NOT EXISTS role_purchases (
                guild_id TEXT, member_id TEXT, role_id TEXT, purchase_time INTEGER,
                PRIMARY KEY (guild_id, member_id, role_id));
        ''')
        await db.commit()


async def _fetchone(query: str, params: tuple = ()):
    async with aiosqlite.connect(DB_FILE) as db:
        async with db.execute(query, params) as cur:
            return await cur.fetchone()


async def _fetchall(query: str, params: tuple = ()):
    async with aiosqlite.connect(DB_FILE) as db:
        async with db.execute(query, params) as cur:
            return await cur.fetchall()


async def _execute(query: str, params: tuple = ()):
    async with aiosqlite.connect(DB_FILE) as db:
        await db.execute(query, params)
        await db.commit()


async def _executemany(query: str, rows: list[tuple]):
    async with aiosqlite.connect(DB_FILE) as db:
        await db.executemany(query, rows)
        await db.commit()


# --- Balance ---
async def get_balance(gid: str, uid: str) -> float:
    r = await _fetchone('SELECT balance FROM balances WHERE guild_id=? AND user_id=?', (gid, uid))
    return r[0] if r else 0.0


async def update_balance(gid: str, uid: str, balance: float) -> None:
    await _execute('INSERT OR REPLACE INTO balances VALUES (?,?,?)', (gid, uid, balance))


# --- Invites ---
async def get_invites(gid: str, uid: str) -> int:
    r = await _fetchone('SELECT invite_count FROM invites WHERE guild_id=? AND user_id=?', (gid, uid))
    return r[0] if r else 0


async def update_invites(gid: str, uid: str, count: int) -> None:
    await _execute('INSERT OR REPLACE INTO invites VALUES (?,?,?)', (gid, uid, count))


# --- User invite codes ---
async def get_user_invite(gid: str, uid: str) -> str | None:
    r = await _fetchone('SELECT invite_code FROM user_invites WHERE guild_id=? AND user_id=?', (gid, uid))
    return r[0] if r else None


async def update_user_invite(gid: str, uid: str, code: str) -> None:
    await _execute('INSERT OR REPLACE INTO user_invites VALUES (?,?,?)', (gid, uid, code))


# --- Affiliate status ---
async def is_affiliate(gid: str, uid: str) -> bool:
    r = await _fetchone('SELECT active FROM affiliates WHERE guild_id=? AND user_id=?', (gid, uid))
    return bool(r[0]) if r else False


async def update_affiliate(gid: str, uid: str, active: int) -> None:
    await _execute('INSERT OR REPLACE INTO affiliates VALUES (?,?,?)', (gid, uid, active))


# --- Invited members ---
async def get_inviter(gid: str, member_id: str) -> str | None:
    r = await _fetchone('SELECT inviter_id FROM invited_members WHERE guild_id=? AND member_id=?', (gid, member_id))
    return r[0] if r else None


async def update_invited_member(gid: str, member_id: str, inviter_id: str | None) -> None:
    await _execute('INSERT OR REPLACE INTO invited_members VALUES (?,?,?)', (gid, member_id, inviter_id))


# --- Private channels ---
async def get_channel(gid: str, uid: str) -> str | None:
    r = await _fetchone('SELECT channel_id FROM channels WHERE guild_id=? AND user_id=?', (gid, uid))
    return r[0] if r else None


async def update_channel(gid: str, uid: str, channel_id: str) -> None:
    await _execute('INSERT OR REPLACE INTO channels VALUES (?,?,?)', (gid, uid, channel_id))


# --- Role purchases ---
async def record_role_purchase(gid: str, member_id: str, role_id: str, purchase_time: int) -> None:
    await _execute('INSERT OR REPLACE INTO role_purchases VALUES (?,?,?,?)',
                   (gid, member_id, role_id, purchase_time))


async def delete_affiliate_data(gid: str, uid: str) -> None:
    for table, col in [('channels', 'user_id'), ('user_invites', 'user_id'),
                       ('invites', 'user_id'), ('affiliates', 'user_id')]:
        await _execute(f'DELETE FROM {table} WHERE guild_id=? AND {col}=?', (gid, uid))

# ---------------------------------------------------------------------------
# Utility helpers
# ---------------------------------------------------------------------------

async def safe_api_call(coro, retries: int = 3):
    for attempt in range(retries):
        try:
            return await coro
        except discord.errors.HTTPException as e:
            if e.status == 429:
                wait = e.retry_after + 0.1
                logger.warning(f"Rate-limited, retrying in {wait:.1f}s (attempt {attempt+1})")
                await asyncio.sleep(wait)
            else:
                logger.error(f"HTTP error: {e}")
                raise
        except Exception as e:
            logger.error(f"Unexpected API error: {e}")
            raise
    raise RuntimeError("Max retries exceeded")


async def get_or_create_user_channel(
    user: discord.Member, guild: discord.Guild
) -> discord.TextChannel | None:
    gid = str(guild.id)
    uid = str(user.id)
    cid = await get_channel(gid, uid)
    if cid:
        ch = guild.get_channel(int(cid))
        if ch:
            perms = ch.permissions_for(user)
            if not (perms.read_messages and perms.send_messages):
                try:
                    await safe_api_call(ch.set_permissions(
                        user, read_messages=True, read_message_history=True,
                        send_messages=True, attach_files=True, send_voice_messages=True,
                    ))
                except Exception as e:
                    logger.error(f"Permission fix failed for {uid}: {e}")
            return ch
    try:
        category = guild.get_channel(CATEGORY_ID)
        overwrites = {
            guild.default_role: discord.PermissionOverwrite(read_messages=False),
            user: discord.PermissionOverwrite(
                read_messages=True, read_message_history=True,
                send_messages=True, attach_files=True, send_voice_messages=True,
            ),
            guild.me: discord.PermissionOverwrite(
                read_messages=True, send_messages=True,
                embed_links=True, attach_files=True,
            ),
        }
        name = f"affiliate-{user.name.lower().replace(' ', '-')[:20]}"
        ch = await safe_api_call(
            guild.create_text_channel(name, overwrites=overwrites, category=category)
        )
        await update_channel(gid, uid, str(ch.id))
        log_ch = guild.get_channel(LOG_CHANNEL_ID)
        if log_ch:
            await safe_api_call(log_ch.send(
                f"📢 Private channel created for {user.name} ({uid}): {ch.name}"
            ))
        return ch
    except Exception as e:
        logger.error(f"Channel creation failed for {uid}: {e}")
        return None


def is_admin(member: discord.Member, guild: discord.Guild) -> bool:
    role = guild.get_role(ADMIN_ROLE_ID)
    return bool(role and role in member.roles)

# ---------------------------------------------------------------------------
# Button cooldown state
# ---------------------------------------------------------------------------
_cooldowns: dict[str, float] = {}


def check_cooldown(uid: str) -> float:
    return max(COOLDOWN_SECONDS - (time.time() - _cooldowns.get(uid, 0)), 0)

# ---------------------------------------------------------------------------
# Affiliate logic helpers (shared by views and events)
# ---------------------------------------------------------------------------

async def update_user_channel(
    bot: commands.Bot,
    inviter: discord.Member,
    guild: discord.Guild,
    invites: int,
    invited_member: discord.Member | None = None,
) -> None:
    gid     = str(guild.id)
    uid     = str(inviter.id)
    channel = await get_or_create_user_channel(inviter, guild)
    if not channel:
        return
    balance = await get_balance(gid, uid)
    desc = (
        f"Hey {inviter.mention}, you've invited **{invites}** member(s)! 🎉\n"
        f"Your current balance is **${balance:.2f}**.\n"
        f"Keep inviting to unlock more rewards! 💪"
    )
    if invites >= 100:
        desc += "\nWOW! You've hit 100 invites! You're a LEGEND! 😎"
    embed = discord.Embed(title="Affiliate Progress Update! 🚀", description=desc,
                          color=discord.Color.dark_green())
    if invited_member:
        embed.add_field(name="New Member", value=invited_member.name, inline=False)
    embed.set_footer(text="No limits! 🏆")
    try:
        await safe_api_call(channel.send(embed=embed))
        log_ch = guild.get_channel(LOG_CHANNEL_ID)
        if log_ch:
            msg = f"📢 {inviter.name} ({uid}) has {invites} invite(s). Balance: ${balance:.2f}"
            if invited_member:
                msg += f" | New: {invited_member.name} ({invited_member.id})"
            await safe_api_call(log_ch.send(msg))
    except Exception as e:
        logger.error(f"update_user_channel error for {uid}: {e}")


async def notify_commission(
    inviter: discord.Member, new_member: discord.Member,
    role_id: int, guild: discord.Guild,
) -> None:
    gid = str(guild.id)
    iid = str(inviter.id)
    if not await is_affiliate(gid, iid):
        return
    channel = await get_or_create_user_channel(inviter, guild)
    if not channel:
        return
    role       = guild.get_role(role_id)
    role_name  = role.name if role else f"Role {role_id}"
    price      = PREMIUM_ROLE_PRICES.get(role_id, 0.0)
    commission = price * 0.5
    current    = await get_balance(gid, iid)
    await update_balance(gid, iid, current + commission)
    await record_role_purchase(gid, str(new_member.id), str(role_id), int(time.time()))
    new_bal = await get_balance(gid, iid)
    embed = discord.Embed(
        title="Cha-Ching! Commission Earned! 💸",
        description=(
            f"BOOM! {new_member.name} bought **{role_name}**, {inviter.mention}! 🎉\n"
            f"You earned **50% = ${commission:.2f}**! 🤑\n"
            f"Total balance: **${new_bal:.2f}**.\n"
            f"Contact an admin to claim your cash! 💪"
        ),
        color=discord.Color.dark_green(),
    )
    embed.set_footer(text="You're raking it in! 🚀")
    try:
        await safe_api_call(channel.send(embed=embed))
        log_ch = guild.get_channel(LOG_CHANNEL_ID)
        if log_ch:
            await safe_api_call(log_ch.send(
                f"📢 {inviter.name} ({iid}) earned ${commission:.2f} commission! "
                f"Balance: ${new_bal:.2f}. Member: {new_member.name} purchased {role_name}."
            ))
    except Exception as e:
        logger.error(f"notify_commission error for {iid}: {e}")


async def check_milestones(
    inviter: discord.Member, invites: int, guild: discord.Guild
) -> None:
    gid     = str(guild.id)
    uid     = str(inviter.id)
    channel = await get_or_create_user_channel(inviter, guild)
    if not channel:
        return
    log_ch       = guild.get_channel(LOG_CHANNEL_ID)
    lowest_rid   = min(PREMIUM_ROLE_PRICES)
    premium_role = guild.get_role(lowest_rid)
    full_access  = guild.get_role(FULL_ACCESS_ROLE_ID)
    try:
        if invites >= 10 and premium_role and premium_role not in inviter.roles:
            reward  = PREMIUM_ROLE_PRICES[lowest_rid]
            await safe_api_call(inviter.add_roles(premium_role))
            bal = await get_balance(gid, uid)
            await update_balance(gid, uid, bal + reward)
            new_bal = await get_balance(gid, uid)
            await safe_api_call(channel.send(
                f"🎉 {inviter.mention}, 10 invites! Unlocked **1-month {premium_role.name}** "
                f"(worth ${reward:.2f})! 🔥 Balance: ${new_bal:.2f}"
            ))
            if log_ch:
                await safe_api_call(log_ch.send(
                    f"📢 {inviter.name} ({uid}) → {premium_role.name}. Balance: ${new_bal:.2f}"
                ))
        if invites >= 100 and full_access and full_access not in inviter.roles:
            await safe_api_call(inviter.add_roles(full_access))
            bal = await get_balance(gid, uid)
            await safe_api_call(channel.send(
                f"🎉 {inviter.mention}, 100 invites! Unlocked **Lifetime Full Server Access**! 🏆 "
                f"Balance: ${bal:.2f}"
            ))
            if log_ch:
                await safe_api_call(log_ch.send(
                    f"📢 {inviter.name} ({uid}) → Lifetime Full Access."
                ))
    except Exception as e:
        logger.error(f"check_milestones error for {uid}: {e}")
        await safe_api_call(channel.send(
            "Oops! Couldn't assign your milestone role. Ask an admin to check my permissions! 😅"
        ))

# ---------------------------------------------------------------------------
# Persistent Views
# ---------------------------------------------------------------------------

class AffiliateButtons(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)

    async def interaction_check(self, interaction: discord.Interaction) -> bool:
        uid = str(interaction.user.id)
        rem = check_cooldown(uid)
        if rem > 0:
            await interaction.response.send_message(
                f"Please wait {rem:.1f}s before clicking again!", ephemeral=True
            )
            return False
        _cooldowns[uid] = time.time()
        return True

    @discord.ui.button(label="Start Affiliate Program", style=discord.ButtonStyle.green,
                       emoji="🚀", custom_id="affiliate:start")
    async def start_affiliate(self, interaction: discord.Interaction, button: discord.ui.Button):
        user  = interaction.user
        guild = interaction.guild
        gid   = str(guild.id)
        uid   = str(user.id)

        if guild.id != GUILD_ID:
            await interaction.response.send_message(
                "This command only works in the specified server!", ephemeral=True
            )
            return
        await interaction.response.defer(ephemeral=True)

        if await is_affiliate(gid, uid):
            await interaction.followup.send(
                "You're already an Affiliate Partner! Keep rocking it! 😎", ephemeral=True
            )
            return

        await update_invites(gid, uid, 0)
        await update_invited_member(gid, uid, None)

        aff_role = guild.get_role(AFFILIATER_ROLE_ID)
        if aff_role and aff_role not in user.roles:
            try:
                await safe_api_call(user.add_roles(aff_role))
            except Exception as e:
                logger.error(f"Role assign error for {uid}: {e}")

        channel = await get_or_create_user_channel(user, guild)
        if not channel:
            await interaction.followup.send(
                "Couldn't create your channel. Ask an admin to check permissions!", ephemeral=True
            )
            return

        try:
            src    = guild.get_channel(CHALLENGE_CHANNEL_ID) or guild.text_channels[0]
            invite = await safe_api_call(src.create_invite(max_age=0, unique=True))
        except Exception as e:
            logger.error(f"Invite creation failed for {uid}: {e}")
            await interaction.followup.send(
                "Can't create invites! Ask an admin to fix my permissions! 😢", ephemeral=True
            )
            return

        await update_user_invite(gid, uid, invite.code)
        await update_affiliate(gid, uid, 1)

        # Cache the new invite
        bot: SobanBot = interaction.client
        bot.invite_cache.setdefault(gid, {})[invite.code] = {
            'uses': invite.uses, 'inviter_id': uid
        }

        embed = discord.Embed(
            title="Welcome To The Affiliate Program! 🚀💸",
            description=(
                f"Time To Make It Rain, {user.mention}!\n"
                f"Invite people → earn **Epic Rewards** + **50% commissions** every month.\n\n"
                f"Your progress updates will land here.\n"
                f"**Referral Invite Link**:\n# **{invite.url}**"
            ),
            color=discord.Color.dark_green(),
        )
        embed.set_footer(text="No limits, just invites! 🏆")
        try:
            await safe_api_call(channel.send(embed=embed))
            await interaction.followup.send(
                "You're in! Check your private channel for your invite link! 🎉", ephemeral=True
            )
            log_ch = guild.get_channel(LOG_CHANNEL_ID)
            if log_ch:
                await safe_api_call(log_ch.send(
                    f"📢 {user.name} ({uid}) joined Affiliate Program! Invite: {invite.url}"
                ))
        except Exception as e:
            logger.error(f"Welcome message failed for {uid}: {e}")
            await interaction.followup.send(
                "Can't message your channel! Ask an admin to check permissions!", ephemeral=True
            )

    @discord.ui.button(label="Stop Affiliate Program", style=discord.ButtonStyle.red,
                       emoji="🛑", custom_id="affiliate:stop")
    async def stop_affiliate(self, interaction: discord.Interaction, button: discord.ui.Button):
        user  = interaction.user
        guild = interaction.guild
        gid   = str(guild.id)
        uid   = str(user.id)

        if guild.id != GUILD_ID:
            await interaction.response.send_message(
                "This command only works in the specified server!", ephemeral=True
            )
            return
        await interaction.response.defer(ephemeral=True)

        if not await is_affiliate(gid, uid):
            await interaction.followup.send(
                "You're not in the Affiliate Program! Click 'Start' to join!", ephemeral=True
            )
            return

        cid = await get_channel(gid, uid)
        ch  = guild.get_channel(int(cid)) if cid else None
        if ch:
            try:
                await safe_api_call(ch.send(
                    f"{user.mention}, you stopped the Affiliate Program! Come back anytime! 🛑"
                ))
                await safe_api_call(ch.delete())
            except Exception as e:
                logger.error(f"Channel delete failed for {uid}: {e}")
                await interaction.followup.send(
                    "Can't delete your channel! Ask an admin to fix permissions!", ephemeral=True
                )
                return

        aff_role = guild.get_role(AFFILIATER_ROLE_ID)
        if aff_role and aff_role in user.roles:
            try:
                await safe_api_call(user.remove_roles(aff_role))
            except Exception as e:
                logger.error(f"Role remove error for {uid}: {e}")

        await delete_affiliate_data(gid, uid)

        bot: SobanBot = interaction.client
        bot.invite_cache[gid] = {
            c: d for c, d in bot.invite_cache.get(gid, {}).items()
            if d['inviter_id'] != uid
        }

        log_ch = guild.get_channel(LOG_CHANNEL_ID)
        if log_ch:
            await safe_api_call(log_ch.send(
                f"📢 {user.name} ({uid}) stopped the Affiliate Program!"
            ))
        await interaction.followup.send(
            "Affiliate Program stopped! Your private channel is gone. Start again anytime! 🚀",
            ephemeral=True,
        )


class AdminButtons(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)

    async def interaction_check(self, interaction: discord.Interaction) -> bool:
        uid = str(interaction.user.id)
        rem = check_cooldown(uid)
        if rem > 0:
            await interaction.response.send_message(
                f"Please wait {rem:.1f}s before clicking again!", ephemeral=True
            )
            return False
        _cooldowns[uid] = time.time()
        return True

    @discord.ui.button(label="Reset Balance (by ID)", style=discord.ButtonStyle.red,
                       emoji="🗑️", custom_id="admin:reset_id")
    async def reset_balance_id(self, interaction: discord.Interaction, button: discord.ui.Button):
        user  = interaction.user
        guild = interaction.guild
        if not is_admin(user, guild):
            await interaction.response.send_message("You don't have permission!", ephemeral=True)
            return

        await interaction.response.send_message(
            "Enter the user ID to reset their balance:", ephemeral=True
        )

        def check(m: discord.Message) -> bool:
            return m.author.id == user.id and m.channel.id == interaction.channel_id

        try:
            msg = await interaction.client.wait_for('message', check=check, timeout=30.0)
        except asyncio.TimeoutError:
            await interaction.followup.send("Timed out.", ephemeral=True)
            return

        try:
            target_id = str(int(msg.content.strip()))
        except ValueError:
            await interaction.followup.send("Invalid user ID.", ephemeral=True)
            return

        await _reset_balance_action(interaction, guild, user, target_id)

    @discord.ui.button(label="Reset Balance (select)", style=discord.ButtonStyle.red,
                       emoji="👤", custom_id="admin:reset_select")
    async def reset_balance_select(self, interaction: discord.Interaction, button: discord.ui.Button):
        user  = interaction.user
        guild = interaction.guild
        gid   = str(guild.id)
        if not is_admin(user, guild):
            await interaction.response.send_message("You don't have permission!", ephemeral=True)
            return

        rows = await _fetchall(
            'SELECT user_id, balance FROM balances WHERE guild_id=?', (gid,)
        )
        if not rows:
            await interaction.response.send_message("No users with balances!", ephemeral=True)
            return

        options = []
        for uid, bal in rows[:25]:
            m     = guild.get_member(int(uid))
            label = m.name if m else f"User {uid}"
            options.append(discord.SelectOption(
                label=label, value=uid, description=f"Balance: ${bal:.2f}"
            ))

        select = discord.ui.Select(placeholder="Select a user", options=options)

        async def callback(inter: discord.Interaction) -> None:
            await _reset_balance_action(inter, guild, user, select.values[0])

        select.callback = callback
        view = discord.ui.View()
        view.add_item(select)
        await interaction.response.send_message(
            "Select a user to reset:", view=view, ephemeral=True
        )


async def _reset_balance_action(
    interaction: discord.Interaction,
    guild: discord.Guild,
    admin: discord.Member,
    target_uid: str,
) -> None:
    gid         = str(guild.id)
    old_balance = await get_balance(gid, target_uid)
    await update_balance(gid, target_uid, 0.0)
    target  = guild.get_member(int(target_uid))
    mention = target.mention if target else f"User {target_uid}"
    msg     = f"Balance for {mention} reset to $0.00 (was ${old_balance:.2f})!"
    try:
        await interaction.response.send_message(msg, ephemeral=True)
    except discord.errors.InteractionResponded:
        await interaction.followup.send(msg, ephemeral=True)
    log_ch = guild.get_channel(LOG_CHANNEL_ID)
    if log_ch:
        await safe_api_call(log_ch.send(
            f"📢 Admin {admin.name} ({admin.id}) reset balance for {mention} "
            f"to $0.00 (was ${old_balance:.2f})"
        ))
    cid = await get_channel(gid, target_uid)
    if cid:
        ch = guild.get_channel(int(cid))
        if ch:
            await safe_api_call(ch.send(
                "💸 Your balance has been reset to $0.00 by an admin. Keep inviting! 🚀"
            ))

# ---------------------------------------------------------------------------
# Bot class
# ---------------------------------------------------------------------------

class SobanBot(commands.AutoShardedBot):
    def __init__(self) -> None:
        intents = discord.Intents.default()
        intents.members         = True
        intents.guilds          = True
        intents.invites         = True
        intents.message_content = True
        super().__init__(command_prefix='!', intents=intents)
        self.invite_cache: dict[str, dict] = {}

    async def setup_hook(self) -> None:
        await init_db()
        self.add_view(AffiliateButtons())
        self.add_view(AdminButtons())
        self.recurring_commission_check.start()

    async def on_ready(self) -> None:
        guild = self.get_guild(GUILD_ID)
        if guild:
            logger.info(f"Connected to guild: {guild.name} ({guild.id})")
            try:
                invites  = await safe_api_call(guild.invites())
                gid      = str(guild.id)
                self.invite_cache[gid] = {
                    inv.code: {'uses': inv.uses, 'inviter_id': str(inv.inviter.id)}
                    for inv in invites if inv.inviter
                }
                for inv in invites:
                    if inv.inviter:
                        await update_invites(gid, str(inv.inviter.id), inv.uses)
                logger.info(f"Cached {len(self.invite_cache[gid])} invites")
            except Exception as e:
                logger.error(f"Invite cache failed: {e}")

            ch = self.get_channel(CHALLENGE_CHANNEL_ID)
            if ch:
                try:
                    embed = discord.Embed(
                        title="Affiliate Program - Earn Reward Commission 🏆💸",
                        description=(
                            "Ready to become a legend? Join the Affiliate Program!\n"
                            "Earn epic rewards + **50% commissions** on premium purchases every month!\n\n"
                            "**Milestones**:\n"
                            "- **10 invites** → 1-month Basic Premium Access 🌟\n"
                            "- **100 invites** → Lifetime Full Server Access 🏆\n\n"
                            "Get **50% of every premium package** your invited members buy, **monthly**!\n\n"
                            "Click below to start or stop. Updates go to your private channel! 🚀"
                        ),
                        color=discord.Color.dark_green(),
                    )
                    embed.set_footer(text="No limits, just invites! 🚀")
                    await safe_api_call(ch.send(embed=embed, view=AffiliateButtons()))
                except Exception as e:
                    logger.error(f"Affiliate embed failed: {e}")

            log_ch = self.get_channel(LOG_CHANNEL_ID)
            if log_ch:
                try:
                    admin_embed = discord.Embed(
                        title="Admin Controls",
                        description="Reset user balances with buttons below or `!resetbalance @user`.",
                        color=discord.Color.red(),
                    )
                    await safe_api_call(log_ch.send(embed=admin_embed, view=AdminButtons()))
                except Exception as e:
                    logger.error(f"Admin embed failed: {e}")

        logger.info(f"Bot ready as {self.user}")

    # ----- Events -----

    async def on_member_join(self, member: discord.Member) -> None:
        guild = member.guild
        if guild.id != GUILD_ID:
            return
        gid = str(guild.id)
        try:
            current_invites = await safe_api_call(guild.invites())
            new_cache = {
                inv.code: {'uses': inv.uses, 'inviter_id': str(inv.inviter.id)}
                for inv in current_invites if inv.inviter
            }
            old_cache = self.invite_cache.get(gid, {})
            rows = await _fetchall('SELECT user_id, invite_code FROM user_invites WHERE guild_id=?', (gid,))

            matched = False
            for uid, code in rows:
                old_uses = old_cache.get(code, {}).get('uses', 0)
                new_uses = new_cache.get(code, {}).get('uses', 0)
                if new_uses > old_uses:
                    await update_invites(gid, uid, new_uses)
                    inviter = guild.get_member(int(uid))
                    if inviter:
                        await update_invited_member(gid, str(member.id), uid)
                        asyncio.create_task(
                            update_user_channel(self, inviter, guild, new_uses, invited_member=member)
                        )
                        asyncio.create_task(check_milestones(inviter, new_uses, guild))
                    matched = True
                    break

            if not matched:
                logger.info(f"No matching invite found for {member.name} ({member.id})")

            self.invite_cache[gid] = new_cache
        except Exception as e:
            logger.error(f"on_member_join error for {member.id}: {e}")

    async def on_member_update(self, before: discord.Member, after: discord.Member) -> None:
        if after.guild.id != GUILD_ID:
            return
        gid       = str(after.guild.id)
        member_id = str(after.id)
        new_roles = set(after.roles) - set(before.roles)
        for role in new_roles:
            if role.id in PREMIUM_ROLE_PRICES:
                inviter_id = await get_inviter(gid, member_id)
                if inviter_id:
                    inviter = after.guild.get_member(int(inviter_id))
                    if inviter:
                        asyncio.create_task(
                            notify_commission(inviter, after, role.id, after.guild)
                        )

    async def on_command(self, ctx: commands.Context) -> None:
        logger.info(f"Command '{ctx.command}' by {ctx.author.name} ({ctx.author.id})")
        cpu = psutil.cpu_percent()
        mem = psutil.virtual_memory().percent
        if cpu > 80 or mem > 80:
            logger.warning(f"High usage — CPU: {cpu}% | Memory: {mem}%")

    async def on_command_error(self, ctx: commands.Context, error: Exception) -> None:
        if isinstance(error, commands.MissingRequiredArgument):
            await ctx.send(f"Missing: `{error.param.name}`. See `!help {ctx.command}`.")
        elif isinstance(error, commands.MemberNotFound):
            await ctx.send("Member not found. Please @mention them.")
        else:
            logger.error(f"Unhandled command error in '{ctx.command}': {error}")

    # ----- Recurring commission task -----

    @tasks.loop(hours=24)
    async def recurring_commission_check(self) -> None:
        guild = self.get_guild(GUILD_ID)
        if not guild:
            return
        gid      = str(guild.id)
        rows     = await _fetchall(
            'SELECT member_id, role_id, purchase_time FROM role_purchases WHERE guild_id=?', (gid,)
        )
        now      = int(time.time())
        one_month = 30 * 24 * 3600
        for member_id, role_id, purchase_time in rows:
            if now - purchase_time < one_month:
                continue
            member = guild.get_member(int(member_id))
            if not member or not any(r.id == int(role_id) for r in member.roles):
                continue
            inviter_id = await get_inviter(gid, member_id)
            if not inviter_id:
                continue
            inviter = guild.get_member(int(inviter_id))
            if inviter:
                await notify_commission(inviter, member, int(role_id), guild)
                await record_role_purchase(gid, member_id, role_id, now)

    @recurring_commission_check.before_loop
    async def before_commission_check(self) -> None:
        await self.wait_until_ready()

# ---------------------------------------------------------------------------
# Commands
# ---------------------------------------------------------------------------

bot = SobanBot()


@bot.command()
async def resetbalance(ctx: commands.Context, member: discord.Member) -> None:
    if ctx.guild.id != GUILD_ID:
        await ctx.send("This command only works in the specified server!")
        return
    if ctx.channel.id != LOG_CHANNEL_ID:
        await ctx.send("This command can only be used in the log channel!", delete_after=5)
        return
    if not is_admin(ctx.author, ctx.guild):
        await ctx.send("You don't have permission! 😡")
        return
    gid         = str(ctx.guild.id)
    target_id   = str(member.id)
    old_balance = await get_balance(gid, target_id)
    await update_balance(gid, target_id, 0.0)
    await ctx.send(f"Balance for {member.mention} reset to $0.00 (was ${old_balance:.2f})!")
    log_ch = ctx.guild.get_channel(LOG_CHANNEL_ID)
    if log_ch:
        await safe_api_call(log_ch.send(
            f"📢 Admin {ctx.author.name} ({ctx.author.id}) reset balance for "
            f"{member.mention} to $0.00 (was ${old_balance:.2f}) via command"
        ))
    cid = await get_channel(gid, target_id)
    if cid:
        ch = ctx.guild.get_channel(int(cid))
        if ch:
            await safe_api_call(ch.send(
                "💸 Your balance has been reset to $0.00 by an admin. Keep inviting! 🚀"
            ))


@bot.command()
async def checkinvites(ctx: commands.Context) -> None:
    if ctx.guild.id != GUILD_ID:
        await ctx.send("This command only works in the specified server!")
        return
    gid     = str(ctx.guild.id)
    uid     = str(ctx.author.id)
    invites = await get_invites(gid, uid)
    balance = await get_balance(gid, uid)
    embed = discord.Embed(
        title="Your Affiliate Progress! 🏆",
        description=(
            f"Hey {ctx.author.mention}, you've invited **{invites}** member(s)! 🎉\n"
            f"Your current balance is **${balance:.2f}**.\n"
            f"Keep inviting to unlock more rewards! 💪"
        ),
        color=discord.Color.dark_green(),
    )
    embed.set_footer(text="No limits! 🏆")
    await safe_api_call(ctx.send(embed=embed))


@bot.command()
async def checkbalance(ctx: commands.Context) -> None:
    if ctx.guild.id != GUILD_ID:
        await ctx.send("This command only works in the specified server!")
        return
    balance = await get_balance(str(ctx.guild.id), str(ctx.author.id))
    embed = discord.Embed(
        title="Your Affiliate Balance 💸",
        description=(
            f"Hey {ctx.author.mention}, your balance is **${balance:.2f}**! 🤑\n"
            f"Contact an admin to claim your earnings! 🚀"
        ),
        color=discord.Color.dark_green(),
    )
    embed.set_footer(text="No limits! 🏆")
    await safe_api_call(ctx.send(embed=embed))


@bot.command()
async def leaderboard(ctx: commands.Context) -> None:
    if ctx.guild.id != GUILD_ID:
        await ctx.send("This command only works in the specified server!")
        return
    rows = await _fetchall(
        'SELECT user_id, invite_count FROM invites WHERE guild_id=? ORDER BY invite_count DESC LIMIT 5',
        (str(ctx.guild.id),)
    )
    embed = discord.Embed(title="🏆 Affiliate Leaderboard 🏆", color=discord.Color.dark_green())
    for idx, (uid, inv_count) in enumerate(rows, 1):
        m   = ctx.guild.get_member(int(uid))
        bal = await get_balance(str(ctx.guild.id), uid)
        embed.add_field(
            name=f"{idx}. {m.name if m else uid}",
            value=f"{inv_count} invites | Balance: ${bal:.2f}",
            inline=False,
        )
    if not rows:
        embed.description = "No invites yet! Start inviting! 🚀"
    embed.set_footer(text="No limits! Claim the top spot! 😎")
    await safe_api_call(ctx.send(embed=embed))


@bot.command()
async def listbalances(ctx: commands.Context) -> None:
    if ctx.guild.id != GUILD_ID:
        await ctx.send("This command only works in the specified server!")
        return
    if not is_admin(ctx.author, ctx.guild):
        await ctx.send("You don't have permission! 😡")
        return
    rows = await _fetchall('SELECT user_id, balance FROM balances WHERE guild_id=?', (str(ctx.guild.id),))
    if not rows:
        await ctx.send("No balances recorded yet!")
        return
    embed = discord.Embed(title="All User Balances 💸", color=discord.Color.blue())
    for uid, bal in rows:
        m = ctx.guild.get_member(int(uid))
        embed.add_field(
            name=f"{m.name if m else uid} ({uid})",
            value=f"Balance: ${bal:.2f}",
            inline=False,
        )
    embed.set_footer(text="Admin-only command")
    await safe_api_call(ctx.send(embed=embed))


@bot.command()
async def checkchannel(ctx: commands.Context) -> None:
    if ctx.guild.id != GUILD_ID:
        await ctx.send("This command only works in the specified server!")
        return
    gid = str(ctx.guild.id)
    uid = str(ctx.author.id)
    cid = await get_channel(gid, uid)
    if not cid:
        await ctx.send("No private channel yet! Click 'Start Affiliate Program' to get started! 😎")
        return
    ch = ctx.guild.get_channel(int(cid))
    if not ch:
        await ctx.send("Your channel is missing! Click 'Start Affiliate Program' to create a new one! 🚀")
        return
    perms = ch.permissions_for(ctx.author)
    if perms.read_messages and perms.send_messages:
        await ctx.send(f"Your private channel: {ch.name} ({ch.id}). Check your progress! 🚀")
    else:
        try:
            await safe_api_call(ch.set_permissions(
                ctx.author,
                read_messages=True, read_message_history=True,
                send_messages=True, attach_files=True, send_voice_messages=True,
            ))
            await ctx.send(f"Permissions fixed! Check out {ch.name} now! 🎉")
        except Exception as e:
            logger.error(f"Permission fix failed for {uid}: {e}")
            await ctx.send("Couldn't fix permissions! Ask an admin to help! 😢")


@bot.command()
async def roast(ctx: commands.Context, member: discord.Member = None) -> None:
    if ctx.guild.id != GUILD_ID:
        await ctx.send("This command only works in the specified server!")
        return
    if not member:
        await ctx.send("Who do you want to roast? Tag someone! 😜")
        return
    roasts = [
        "{user}, you're so slow even a snail lapped you! 🐌",
        "{user}, your invites are so low, even Wi-Fi feels bad for you! 📡",
        "{user}, you're so chill, the leaderboard forgot you exist! 😎",
    ]
    await safe_api_call(ctx.send(random.choice(roasts).format(user=member.mention)))


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == '__main__':
    asyncio.run(bot.start(BOT_TOKEN))
