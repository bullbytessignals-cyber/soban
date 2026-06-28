"""
Soban Discord Affiliate Bot — single-file edition
Dashboard delivered via ephemeral messages (only visible to the user)
"""

import asyncio
import datetime
import logging
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
# Config
# ---------------------------------------------------------------------------
BOT_TOKEN            = 'YOUR_BOT_TOKEN_HERE'   # <-- apna token yahan daalo

GUILD_ID             = 1348248729878134885
CHALLENGE_CHANNEL_ID = 1388256520541700176
LOG_CHANNEL_ID       = 1388138273834012682
ADMIN_ROLE_ID        = 1376921339994181734
AFFILIATER_ROLE_ID   = 1404007129593020520

# role_id → (price_usd, commission_usd, display_name)
PREMIUM_PACKAGES: dict[int, tuple[float, float, str]] = {
    1404040571018023024: (10.0,  4.0,  "PREMIUM 👑"),
    1387177079270805645: (15.0,  6.0,  "ELITE 👑"),
    0000000000000000001: (10.0,  4.0,  "FOREX BOT 👑"),   # <-- FOREX BOT role ID daalo
    0000000000000000002: (10.0,  4.0,  "CRYPTO BOT 👑"),  # <-- CRYPTO BOT role ID daalo
}

# Affiliate panel image — apni marzi ki image URL yahan daalo
AFFILIATE_BANNER_URL = "https://i.imgur.com/4M34hi2.png"

DB_FILE          = 'bot_data.db'
COOLDOWN_SECONDS = 5

# ---------------------------------------------------------------------------
# Database
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


async def get_balance(gid: str, uid: str) -> float:
    r = await _fetchone('SELECT balance FROM balances WHERE guild_id=? AND user_id=?', (gid, uid))
    return r[0] if r else 0.0

async def update_balance(gid: str, uid: str, balance: float) -> None:
    await _execute('INSERT OR REPLACE INTO balances VALUES (?,?,?)', (gid, uid, balance))

async def get_invites(gid: str, uid: str) -> int:
    r = await _fetchone('SELECT invite_count FROM invites WHERE guild_id=? AND user_id=?', (gid, uid))
    return r[0] if r else 0

async def update_invites(gid: str, uid: str, count: int) -> None:
    await _execute('INSERT OR REPLACE INTO invites VALUES (?,?,?)', (gid, uid, count))

async def get_user_invite(gid: str, uid: str) -> str | None:
    r = await _fetchone('SELECT invite_code FROM user_invites WHERE guild_id=? AND user_id=?', (gid, uid))
    return r[0] if r else None

async def update_user_invite(gid: str, uid: str, code: str) -> None:
    await _execute('INSERT OR REPLACE INTO user_invites VALUES (?,?,?)', (gid, uid, code))

async def is_affiliate(gid: str, uid: str) -> bool:
    r = await _fetchone('SELECT active FROM affiliates WHERE guild_id=? AND user_id=?', (gid, uid))
    return bool(r[0]) if r else False

async def update_affiliate(gid: str, uid: str, active: int) -> None:
    await _execute('INSERT OR REPLACE INTO affiliates VALUES (?,?,?)', (gid, uid, active))

async def get_inviter(gid: str, member_id: str) -> str | None:
    r = await _fetchone('SELECT inviter_id FROM invited_members WHERE guild_id=? AND member_id=?', (gid, member_id))
    return r[0] if r else None

async def update_invited_member(gid: str, member_id: str, inviter_id: str | None) -> None:
    await _execute('INSERT OR REPLACE INTO invited_members VALUES (?,?,?)', (gid, member_id, inviter_id))

async def record_role_purchase(gid: str, member_id: str, role_id: str, purchase_time: int) -> None:
    await _execute('INSERT OR REPLACE INTO role_purchases VALUES (?,?,?,?)',
                   (gid, member_id, role_id, purchase_time))

async def delete_affiliate_data(gid: str, uid: str) -> None:
    for table, col in [('user_invites', 'user_id'), ('invites', 'user_id'), ('affiliates', 'user_id')]:
        await _execute(f'DELETE FROM {table} WHERE guild_id=? AND {col}=?', (gid, uid))

async def get_all_commissions(gid: str, uid: str) -> list[tuple]:
    rows = await _fetchall(
        'SELECT member_id FROM invited_members WHERE guild_id=? AND inviter_id=?', (gid, uid)
    )
    result = []
    for (mid,) in rows:
        purchases = await _fetchall(
            'SELECT role_id, purchase_time FROM role_purchases WHERE guild_id=? AND member_id=?',
            (gid, mid)
        )
        result.extend(purchases)
    return result

# ---------------------------------------------------------------------------
# Helpers
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


def is_admin(member: discord.Member, guild: discord.Guild) -> bool:
    role = guild.get_role(ADMIN_ROLE_ID)
    return bool(role and role in member.roles)


_cooldowns: dict[str, float] = {}

def check_cooldown(uid: str) -> float:
    return max(COOLDOWN_SECONDS - (time.time() - _cooldowns.get(uid, 0)), 0)


def pkt_now() -> datetime.datetime:
    return datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=5)))

# ---------------------------------------------------------------------------
# Dashboard embed — ephemeral (sirf us user ko dikhega)
# ---------------------------------------------------------------------------

async def build_dashboard_embed(
    user: discord.Member,
    guild: discord.Guild,
    invite_url: str | None = None,
    event_text: str | None = None,
) -> discord.Embed:
    gid         = str(guild.id)
    uid         = str(user.id)
    balance     = await get_balance(gid, uid)
    inv_count   = await get_invites(gid, uid)
    commissions = await get_all_commissions(gid, uid)

    monthly_potential = sum(
        PREMIUM_PACKAGES.get(int(role_id), (0, 0, ''))[1]
        for role_id, _ in commissions
    )

    invited_rows = await _fetchall(
        'SELECT member_id FROM invited_members WHERE guild_id=? AND inviter_id=?', (gid, uid)
    )
    active_members = sum(
        1 for (mid,) in invited_rows if guild.get_member(int(mid))
    )

    embed = discord.Embed(
        title="📊 Your Affiliate Dashboard",
        description=event_text or "Here's your latest affiliate stats:",
        color=discord.Color.dark_green(),
        timestamp=pkt_now(),
    )
    embed.set_author(name=user.display_name, icon_url=user.display_avatar.url)

    embed.add_field(name="👥 Total Invites",     value=f"```{inv_count}```",             inline=True)
    embed.add_field(name="✅ Active Members",    value=f"```{active_members}```",         inline=True)
    embed.add_field(name="💰 Total Earned",      value=f"```${balance:.2f}```",           inline=True)
    embed.add_field(name="🔄 Monthly Est.",      value=f"```${monthly_potential:.2f}```", inline=True)
    embed.add_field(name="📦 Packages Sold",     value=f"```{len(commissions)}```",       inline=True)
    embed.add_field(name="💵 Commission Rate",   value="```40%```",                       inline=True)

    if invite_url:
        embed.add_field(
            name="🔗 Your Referral Link",
            value=f"```{invite_url}```",
            inline=False,
        )

    pkg_lines = []
    for role_id, (price, commission, pkg_name) in PREMIUM_PACKAGES.items():
        pkg_lines.append(f"• **{pkg_name}**: ${price:.2f}/mo → you earn **${commission:.2f}**")
    embed.add_field(
        name="📋 Commission Structure",
        value="\n".join(pkg_lines),
        inline=False,
    )

    embed.set_footer(text="Only you can see this • Updates on every invite & purchase")
    return embed


async def send_ephemeral_dashboard(
    interaction: discord.Interaction,
    event_text: str | None = None,
    already_deferred: bool = False,
) -> None:
    """Send/update dashboard as ephemeral message — only the user sees it."""
    user  = interaction.user
    guild = interaction.guild
    gid   = str(guild.id)
    uid   = str(user.id)

    code       = await get_user_invite(gid, uid)
    invite_url = f"https://discord.gg/{code}" if code else None

    embed = await build_dashboard_embed(user, guild, invite_url, event_text)

    if already_deferred:
        await interaction.followup.send(embed=embed, ephemeral=True)
    else:
        try:
            await interaction.response.send_message(embed=embed, ephemeral=True)
        except discord.errors.InteractionResponded:
            await interaction.followup.send(embed=embed, ephemeral=True)


async def notify_commission_dm(
    inviter: discord.Member,
    new_member: discord.Member,
    role_id: int,
    guild: discord.Guild,
) -> None:
    """Send commission notification via DM when inviter earns money."""
    gid = str(guild.id)
    iid = str(inviter.id)

    if not await is_affiliate(gid, iid):
        return

    role       = guild.get_role(role_id)
    pkg        = PREMIUM_PACKAGES.get(role_id, (0.0, 0.0, f"Role {role_id}"))
    price, commission, role_name = pkg[0], pkg[1], pkg[2]
    current    = await get_balance(gid, iid)
    await update_balance(gid, iid, current + commission)
    await record_role_purchase(gid, str(new_member.id), str(role_id), int(time.time()))
    new_bal = await get_balance(gid, iid)

    # DM the inviter
    embed = discord.Embed(
        title="💸 Commission Earned!",
        description=(
            f"**{new_member.display_name}** just bought **{role_name}**!\n\n"
            f"💰 You earned: **${commission:.2f}** commission\n"
            f"💼 New balance: **${new_bal:.2f}**\n\n"
            f"Contact an admin in **{guild.name}** to claim your earnings!"
        ),
        color=discord.Color.gold(),
        timestamp=pkt_now(),
    )
    embed.set_footer(text="Soban Affiliate Program")
    try:
        await inviter.send(embed=embed)
    except discord.errors.Forbidden:
        logger.info(f"Cannot DM {iid} (DMs disabled)")

    log_ch = guild.get_channel(LOG_CHANNEL_ID)
    if log_ch:
        await safe_api_call(log_ch.send(
            f"📢 **Commission** | {inviter.name} ({iid}) earned **${commission:.2f}** "
            f"→ balance **${new_bal:.2f}** | "
            f"{new_member.name} purchased {role_name}"
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
                f"⏳ Please wait **{rem:.1f}s** before clicking again!", ephemeral=True
            )
            return False
        _cooldowns[uid] = time.time()
        return True

    @discord.ui.button(
        label="Start Affiliate Program",
        style=discord.ButtonStyle.green,
        emoji="🚀",
        custom_id="affiliate:start",
    )
    async def start_affiliate(self, interaction: discord.Interaction, button: discord.ui.Button):
        user  = interaction.user
        guild = interaction.guild
        gid   = str(guild.id)
        uid   = str(user.id)

        if guild.id != GUILD_ID:
            await interaction.response.send_message("❌ Wrong server!", ephemeral=True)
            return

        await interaction.response.defer(ephemeral=True)

        if await is_affiliate(gid, uid):
            # Already in — just show their dashboard
            await send_ephemeral_dashboard(
                interaction,
                event_text="✅ You're already an Affiliate Partner! Here's your dashboard:",
                already_deferred=True,
            )
            return

        # Reset invite data for fresh start
        await update_invites(gid, uid, 0)
        await update_invited_member(gid, uid, None)

        # Assign Affiliater role
        aff_role = guild.get_role(AFFILIATER_ROLE_ID)
        if aff_role and aff_role not in user.roles:
            try:
                await safe_api_call(user.add_roles(aff_role))
            except Exception as e:
                logger.error(f"Role assign error for {uid}: {e}")

        # Create unique invite link
        try:
            src    = guild.get_channel(CHALLENGE_CHANNEL_ID) or guild.text_channels[0]
            invite = await safe_api_call(src.create_invite(max_age=0, unique=True))
        except Exception as e:
            logger.error(f"Invite creation failed for {uid}: {e}")
            await interaction.followup.send(
                "❌ Can't create your invite link! Ask an admin to fix my permissions.",
                ephemeral=True,
            )
            return

        await update_user_invite(gid, uid, invite.code)
        await update_affiliate(gid, uid, 1)

        # Cache invite
        bot_obj: SobanBot = interaction.client
        bot_obj.invite_cache.setdefault(gid, {})[invite.code] = {
            'uses': invite.uses, 'inviter_id': uid,
        }

        # Send dashboard as ephemeral — only this user sees it
        await send_ephemeral_dashboard(
            interaction,
            event_text=(
                f"🎉 **Welcome to the Affiliate Program!**\n\n"
                f"Share your referral link below. When someone you invited buys a "
                f"**Premium Package**, you earn **50% commission** — every month they renew!\n\n"
                f"This dashboard is **only visible to you**. "
                f"Click **📊 My Dashboard** anytime to refresh it."
            ),
            already_deferred=True,
        )

        log_ch = guild.get_channel(LOG_CHANNEL_ID)
        if log_ch:
            await safe_api_call(log_ch.send(
                f"📢 **New Affiliate** | {user.name} ({uid}) joined! Invite: {invite.url}"
            ))

    @discord.ui.button(
        label="My Dashboard",
        style=discord.ButtonStyle.blurple,
        emoji="📊",
        custom_id="affiliate:dashboard",
    )
    async def view_dashboard(self, interaction: discord.Interaction, button: discord.ui.Button):
        user  = interaction.user
        guild = interaction.guild
        gid   = str(guild.id)
        uid   = str(user.id)

        if guild.id != GUILD_ID:
            await interaction.response.send_message("❌ Wrong server!", ephemeral=True)
            return

        if not await is_affiliate(gid, uid):
            await interaction.response.send_message(
                "❌ You're not in the Affiliate Program yet!\n"
                "Click **🚀 Start Affiliate Program** to join.",
                ephemeral=True,
            )
            return

        # Show dashboard — only this user sees it
        await send_ephemeral_dashboard(interaction)



class AdminButtons(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)

    async def interaction_check(self, interaction: discord.Interaction) -> bool:
        uid = str(interaction.user.id)
        rem = check_cooldown(uid)
        if rem > 0:
            await interaction.response.send_message(
                f"⏳ Please wait **{rem:.1f}s**!", ephemeral=True
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
            await interaction.response.send_message("❌ No permission!", ephemeral=True)
            return
        await interaction.response.send_message("🔢 Enter the **User ID**:", ephemeral=True)

        def check(m: discord.Message) -> bool:
            return m.author.id == user.id and m.channel.id == interaction.channel_id

        try:
            msg = await interaction.client.wait_for('message', check=check, timeout=30.0)
        except asyncio.TimeoutError:
            await interaction.followup.send("⏰ Timed out.", ephemeral=True)
            return
        try:
            target_id = str(int(msg.content.strip()))
        except ValueError:
            await interaction.followup.send("❌ Invalid user ID.", ephemeral=True)
            return
        await _reset_balance_action(interaction, guild, user, target_id)

    @discord.ui.button(label="Reset Balance (select)", style=discord.ButtonStyle.red,
                       emoji="👤", custom_id="admin:reset_select")
    async def reset_balance_select(self, interaction: discord.Interaction, button: discord.ui.Button):
        user  = interaction.user
        guild = interaction.guild
        gid   = str(guild.id)
        if not is_admin(user, guild):
            await interaction.response.send_message("❌ No permission!", ephemeral=True)
            return
        rows = await _fetchall(
            'SELECT user_id, balance FROM balances WHERE guild_id=?', (gid,)
        )
        if not rows:
            await interaction.response.send_message("No users with balances!", ephemeral=True)
            return
        options = [
            discord.SelectOption(
                label=guild.get_member(int(uid)).display_name if guild.get_member(int(uid)) else f"User {uid}",
                value=uid,
                description=f"Balance: ${bal:.2f}",
            )
            for uid, bal in rows[:25]
        ]
        select = discord.ui.Select(placeholder="Select a user", options=options)
        async def callback(inter: discord.Interaction) -> None:
            await _reset_balance_action(inter, guild, user, select.values[0])
        select.callback = callback
        view = discord.ui.View()
        view.add_item(select)
        await interaction.response.send_message("Select a user:", view=view, ephemeral=True)

    @discord.ui.button(label="View All Balances", style=discord.ButtonStyle.grey,
                       emoji="📋", custom_id="admin:list_balances")
    async def list_balances(self, interaction: discord.Interaction, button: discord.ui.Button):
        user  = interaction.user
        guild = interaction.guild
        gid   = str(guild.id)
        if not is_admin(user, guild):
            await interaction.response.send_message("❌ No permission!", ephemeral=True)
            return
        await interaction.response.defer(ephemeral=True)
        rows = await _fetchall(
            'SELECT user_id, balance FROM balances WHERE guild_id=? ORDER BY balance DESC', (gid,)
        )
        if not rows:
            await interaction.followup.send("No balances yet.", ephemeral=True)
            return
        embed = discord.Embed(
            title="💰 All Affiliate Balances",
            color=discord.Color.gold(),
            timestamp=pkt_now(),
        )
        lines = []
        for i, (uid, bal) in enumerate(rows, 1):
            m = guild.get_member(int(uid))
            lines.append(f"`{i:02}.` **{m.display_name if m else uid}** — ${bal:.2f}")
        embed.description = "\n".join(lines)
        embed.set_footer(text="Admin view")
        await interaction.followup.send(embed=embed, ephemeral=True)


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
    msg = f"✅ Balance for {mention} reset to **$0.00** (was **${old_balance:.2f}**)!"
    try:
        await interaction.response.send_message(msg, ephemeral=True)
    except discord.errors.InteractionResponded:
        await interaction.followup.send(msg, ephemeral=True)

    log_ch = guild.get_channel(LOG_CHANNEL_ID)
    if log_ch:
        await safe_api_call(log_ch.send(
            f"📢 **Balance Reset** | Admin {admin.name} reset {mention} "
            f"balance to $0.00 (was ${old_balance:.2f})"
        ))

    # DM the target user
    if target:
        try:
            await target.send(
                f"⚠️ Your affiliate balance in **{guild.name}** has been reset to **$0.00** by an admin."
            )
        except discord.errors.Forbidden:
            pass

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
            logger.info(f"Connected: {guild.name} ({guild.id})")
            try:
                invites = await safe_api_call(guild.invites())
                gid     = str(guild.id)
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

            # Affiliate panel
            ch = self.get_channel(CHALLENGE_CHANNEL_ID)
            if ch:
                try:
                    pkg_lines = [
                        f"• **{pkg_name}**: ${price:.2f}/mo → you earn **${commission:.2f}**"
                        for _, (price, commission, pkg_name) in PREMIUM_PACKAGES.items()
                    ]
                    embed = discord.Embed(
                        title="💸 Affiliate Program — Earn Commission",
                        description=(
                            "Invite people to this server and earn commission "
                            "every time someone you invited buys or renews a Premium Package!\n\n"
                            "**How it works:**\n"
                            "1️⃣ Click **🚀 Start Affiliate Program** below\n"
                            "2️⃣ Get your unique referral invite link\n"
                            "3️⃣ Share it — when your invites buy premium, **you earn commission**\n"
                            "4️⃣ Track everything on your personal **📊 Dashboard**\n\n"
                            "**Premium Packages:**\n" + "\n".join(pkg_lines)
                        ),
                        color=discord.Color.dark_green(),
                    )
                    embed.set_image(url=AFFILIATE_BANNER_URL)
                    embed.set_footer(text="No limits — invite more, earn more! 🚀")
                    await safe_api_call(ch.send(embed=embed, view=AffiliateButtons()))
                except Exception as e:
                    logger.error(f"Affiliate embed failed: {e}")

            # Admin panel
            log_ch = self.get_channel(LOG_CHANNEL_ID)
            if log_ch:
                try:
                    admin_embed = discord.Embed(
                        title="🛡️ Admin Control Panel",
                        description=(
                            "Manage affiliate balances with the buttons below.\n"
                            "Commands: `!resetbalance @user` | `!listbalances` | `!dashboard @user`"
                        ),
                        color=discord.Color.red(),
                    )
                    await safe_api_call(log_ch.send(embed=admin_embed, view=AdminButtons()))
                except Exception as e:
                    logger.error(f"Admin embed failed: {e}")

        logger.info(f"Bot ready as {self.user}")

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
            rows = await _fetchall(
                'SELECT user_id, invite_code FROM user_invites WHERE guild_id=?', (gid,)
            )
            matched = False
            for uid, code in rows:
                old_uses = old_cache.get(code, {}).get('uses', 0)
                new_uses = new_cache.get(code, {}).get('uses', 0)
                if new_uses > old_uses:
                    await update_invites(gid, uid, new_uses)
                    inviter = guild.get_member(int(uid))
                    if inviter:
                        await update_invited_member(gid, str(member.id), uid)
                        # DM the inviter about the new invite
                        embed = discord.Embed(
                            title="👥 New Invite!",
                            description=(
                                f"**{member.display_name}** just joined using your referral link!\n\n"
                                f"📊 Total invites: **{new_uses}**\n"
                                f"💰 Balance: **${await get_balance(gid, uid):.2f}**\n\n"
                                f"Click **📊 My Dashboard** in the server to see full stats."
                            ),
                            color=discord.Color.dark_green(),
                            timestamp=pkt_now(),
                        )
                        embed.set_footer(text="Soban Affiliate Program")
                        try:
                            await inviter.send(embed=embed)
                        except discord.errors.Forbidden:
                            logger.info(f"Cannot DM {uid}")

                        log_ch = guild.get_channel(LOG_CHANNEL_ID)
                        if log_ch:
                            asyncio.create_task(safe_api_call(log_ch.send(
                                f"📢 **New Invite** | {inviter.name} → {member.name} joined. "
                                f"Total: {new_uses}"
                            )))
                    matched = True
                    break
            if not matched:
                logger.info(f"No matching invite for {member.name} ({member.id})")
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
            if role.id in PREMIUM_PACKAGES:
                inviter_id = await get_inviter(gid, member_id)
                if inviter_id:
                    inviter = after.guild.get_member(int(inviter_id))
                    if inviter:
                        asyncio.create_task(
                            notify_commission_dm(inviter, after, role.id, after.guild)
                        )

    async def on_command(self, ctx: commands.Context) -> None:
        logger.info(f"Command '{ctx.command}' by {ctx.author.name} ({ctx.author.id})")
        cpu = psutil.cpu_percent()
        mem = psutil.virtual_memory().percent
        if cpu > 80 or mem > 80:
            logger.warning(f"High usage — CPU: {cpu}% | Memory: {mem}%")

    async def on_command_error(self, ctx: commands.Context, error: Exception) -> None:
        if isinstance(error, commands.MissingRequiredArgument):
            await ctx.send(f"❌ Missing: `{error.param.name}`. See `!help {ctx.command}`.")
        elif isinstance(error, commands.MemberNotFound):
            await ctx.send("❌ Member not found. Please @mention them.")
        else:
            logger.error(f"Unhandled error in '{ctx.command}': {error}")

    @tasks.loop(hours=24)
    async def recurring_commission_check(self) -> None:
        guild = self.get_guild(GUILD_ID)
        if not guild:
            return
        gid       = str(guild.id)
        rows      = await _fetchall(
            'SELECT member_id, role_id, purchase_time FROM role_purchases WHERE guild_id=?', (gid,)
        )
        now       = int(time.time())
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
                await notify_commission_dm(inviter, member, int(role_id), guild)
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
        return
    if ctx.channel.id != LOG_CHANNEL_ID:
        await ctx.send("❌ Only usable in the log channel!", delete_after=5)
        return
    if not is_admin(ctx.author, ctx.guild):
        await ctx.send("❌ No permission!")
        return
    gid         = str(ctx.guild.id)
    old_balance = await get_balance(gid, str(member.id))
    await update_balance(gid, str(member.id), 0.0)
    await ctx.send(f"✅ {member.mention} balance reset to $0.00 (was ${old_balance:.2f})")
    try:
        await member.send(
            f"⚠️ Your affiliate balance in **{ctx.guild.name}** has been reset to **$0.00** by an admin."
        )
    except discord.errors.Forbidden:
        pass


@bot.command()
async def checkinvites(ctx: commands.Context) -> None:
    if ctx.guild.id != GUILD_ID:
        return
    gid     = str(ctx.guild.id)
    uid     = str(ctx.author.id)
    invites = await get_invites(gid, uid)
    balance = await get_balance(gid, uid)
    embed = discord.Embed(
        title="📊 Your Affiliate Stats",
        color=discord.Color.dark_green(),
        timestamp=pkt_now(),
    )
    embed.set_author(name=ctx.author.display_name, icon_url=ctx.author.display_avatar.url)
    embed.add_field(name="👥 Invites",  value=f"```{invites}```",    inline=True)
    embed.add_field(name="💰 Balance",  value=f"```${balance:.2f}```", inline=True)
    embed.set_footer(text="Click 📊 My Dashboard in the affiliate panel for full stats")
    await ctx.send(embed=embed)


@bot.command()
async def checkbalance(ctx: commands.Context) -> None:
    if ctx.guild.id != GUILD_ID:
        return
    balance = await get_balance(str(ctx.guild.id), str(ctx.author.id))
    embed = discord.Embed(
        title="💰 Your Affiliate Balance",
        description=(
            f"**Current Balance:** `${balance:.2f}`\n\n"
            f"Contact an admin to claim your earnings! 🚀"
        ),
        color=discord.Color.dark_green(),
    )
    await ctx.send(embed=embed)


@bot.command()
async def leaderboard(ctx: commands.Context) -> None:
    if ctx.guild.id != GUILD_ID:
        return
    rows = await _fetchall(
        'SELECT user_id, invite_count FROM invites WHERE guild_id=? ORDER BY invite_count DESC LIMIT 10',
        (str(ctx.guild.id),)
    )
    medals = ["🥇", "🥈", "🥉"]
    embed = discord.Embed(
        title="🏆 Affiliate Leaderboard",
        color=discord.Color.gold(),
        timestamp=pkt_now(),
    )
    lines = []
    for idx, (uid, inv_count) in enumerate(rows, 1):
        m   = ctx.guild.get_member(int(uid))
        bal = await get_balance(str(ctx.guild.id), uid)
        medal = medals[idx-1] if idx <= 3 else f"`{idx:02}.`"
        lines.append(f"{medal} **{m.display_name if m else uid}** — {inv_count} invites | ${bal:.2f}")
    embed.description = "\n".join(lines) if lines else "No invites yet!"
    embed.set_footer(text="Invite more to climb the ranks!")
    await ctx.send(embed=embed)


@bot.command()
async def listbalances(ctx: commands.Context) -> None:
    if ctx.guild.id != GUILD_ID:
        return
    if not is_admin(ctx.author, ctx.guild):
        await ctx.send("❌ No permission!")
        return
    rows = await _fetchall(
        'SELECT user_id, balance FROM balances WHERE guild_id=? ORDER BY balance DESC',
        (str(ctx.guild.id),)
    )
    if not rows:
        await ctx.send("No balances yet.")
        return
    embed = discord.Embed(title="💰 All Balances", color=discord.Color.blue(), timestamp=pkt_now())
    lines = [
        f"`{i:02}.` **{ctx.guild.get_member(int(uid)).display_name if ctx.guild.get_member(int(uid)) else uid}** — ${bal:.2f}"
        for i, (uid, bal) in enumerate(rows, 1)
    ]
    embed.description = "\n".join(lines)
    await ctx.send(embed=embed)


@bot.command()
async def checkchannel(ctx: commands.Context) -> None:
    """Now just tells user to use the dashboard button."""
    if ctx.guild.id != GUILD_ID:
        return
    await ctx.send(
        "ℹ️ There are no private channels anymore.\n"
        "Click **📊 My Dashboard** in the affiliate panel to see your stats!",
        delete_after=15,
    )


@bot.command()
async def roast(ctx: commands.Context, member: discord.Member = None) -> None:
    if ctx.guild.id != GUILD_ID:
        return
    if not member:
        await ctx.send("Who do you want to roast? Tag someone! 😜")
        return
    roasts = [
        "{user}, you're so slow even a snail lapped you! 🐌",
        "{user}, your invites are so low, even Wi-Fi feels bad for you! 📡",
        "{user}, you're so chill, the leaderboard forgot you exist! 😎",
        "{user}, bhai invite link share karo, ya ghar baith ke Netflix dekho! 😂",
        "{user}, itni slow progress ke sath tum tortoise bhi race jeet lo! 🐢",
    ]
    await ctx.send(random.choice(roasts).format(user=member.mention))


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == '__main__':
    asyncio.run(bot.start(BOT_TOKEN))
