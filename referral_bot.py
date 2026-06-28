"""
Premium Referral Bot — improved edition
9 invites = 30 Days Free Premium Role
"""

import asyncio
import datetime
import logging

import aiosqlite
import discord
from discord.ext import commands, tasks

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
_PKT = datetime.timezone(datetime.timedelta(hours=5))
logging.Formatter.converter = lambda *args: datetime.datetime.now(_PKT).timetuple()

_fmt = logging.Formatter('%(asctime)s | %(levelname)-8s | %(name)s | %(message)s')
_fh  = logging.FileHandler('referral_bot.log', encoding='utf-8')
_fh.setFormatter(_fmt)
_fh.setLevel(logging.DEBUG)
_ch  = logging.StreamHandler()
_ch.setFormatter(_fmt)
_ch.setLevel(logging.DEBUG)
logging.root.setLevel(logging.DEBUG)
logging.root.addHandler(_fh)
logging.root.addHandler(_ch)
logging.getLogger('discord').setLevel(logging.WARNING)
logging.getLogger('aiosqlite').setLevel(logging.WARNING)

logger = logging.getLogger('referral_bot')

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
BOT_TOKEN            = 'YOUR_BOT_TOKEN_HERE'   # <-- apna token yahan daalo

GUILD_ID             = 1348248729878134885
DASHBOARD_CHANNEL_ID = 1483221485664469123
LOG_CHANNEL_ID       = 1502778641870749917
ADMIN_ROLE_ID        = 1376921339994181734   # admin role
PREMIUM_ROLE_ID      = 1399925083492847727   # free premium role

DB_NAME              = 'referral_bot.db'
INVITES_REQUIRED     = 9      # kitne invites chahiye
PREMIUM_DAYS         = 30     # kitne din ka premium
MILESTONES           = [3, 6, INVITES_REQUIRED]   # DM bhejne ke points

# ---------------------------------------------------------------------------
# DB helpers
# ---------------------------------------------------------------------------

async def init_db() -> None:
    async with aiosqlite.connect(DB_NAME) as db:
        await db.executescript('''
            CREATE TABLE IF NOT EXISTS referrals (
                user_id     INTEGER PRIMARY KEY,
                invite_code TEXT UNIQUE,
                count       INTEGER DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS premium_users (
                user_id    INTEGER PRIMARY KEY,
                expires_at TEXT
            );
            CREATE TABLE IF NOT EXISTS joined_via (
                member_id  INTEGER PRIMARY KEY,
                inviter_id INTEGER
            );
        ''')
        await db.commit()
    logger.info("[DB] Tables ready")


async def db_fetchone(query: str, params: tuple = ()):
    async with aiosqlite.connect(DB_NAME) as db:
        async with db.execute(query, params) as cur:
            return await cur.fetchone()

async def db_fetchall(query: str, params: tuple = ()):
    async with aiosqlite.connect(DB_NAME) as db:
        async with db.execute(query, params) as cur:
            return await cur.fetchall()

async def db_execute(query: str, params: tuple = ()):
    async with aiosqlite.connect(DB_NAME) as db:
        await db.execute(query, params)
        await db.commit()


async def get_count(user_id: int) -> int:
    r = await db_fetchone('SELECT count FROM referrals WHERE user_id=?', (user_id,))
    return r[0] if r else 0

async def get_invite_code(user_id: int) -> str | None:
    r = await db_fetchone('SELECT invite_code FROM referrals WHERE user_id=?', (user_id,))
    return r[0] if r else None

async def is_premium(user_id: int) -> bool:
    r = await db_fetchone('SELECT expires_at FROM premium_users WHERE user_id=?', (user_id,))
    if not r:
        return False
    return datetime.datetime.fromisoformat(r[0]) > datetime.datetime.now(datetime.timezone.utc)

async def get_expires(user_id: int) -> datetime.datetime | None:
    r = await db_fetchone('SELECT expires_at FROM premium_users WHERE user_id=?', (user_id,))
    return datetime.datetime.fromisoformat(r[0]) if r else None

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def progress_bar(current: int, total: int, length: int = 10) -> str:
    filled = int(length * current / total)
    bar    = '█' * filled + '░' * (length - filled)
    pct    = int(100 * current / total)
    return f"`{bar}` {pct}%"


def pkt_now() -> datetime.datetime:
    return datetime.datetime.now(_PKT)


def is_admin(member: discord.Member) -> bool:
    role = member.guild.get_role(ADMIN_ROLE_ID)
    return bool(role and role in member.roles) or member.guild_permissions.administrator


async def send_milestone_dm(member: discord.Member, count: int, guild: discord.Guild) -> None:
    if count == INVITES_REQUIRED:
        title = "🎉 Congratulations! Premium Unlocked!"
        desc  = (
            f"You've invited **{count}/{INVITES_REQUIRED}** members!\n\n"
            f"✅ **30 Days Premium** has been added to your account in **{guild.name}**!\n\n"
            f"Keep inviting to renew your premium next month!"
        )
        color = discord.Color.gold()
    else:
        remaining = INVITES_REQUIRED - count
        title = f"🔥 Milestone Reached — {count}/{INVITES_REQUIRED} Invites!"
        desc  = (
            f"Great progress! You've invited **{count}** members.\n\n"
            f"Only **{remaining} more** to unlock **30 Days Free Premium** in **{guild.name}**!\n\n"
            f"{progress_bar(count, INVITES_REQUIRED)} {count}/{INVITES_REQUIRED}"
        )
        color = discord.Color.green()

    embed = discord.Embed(title=title, description=desc, color=color, timestamp=pkt_now())
    embed.set_footer(text=f"{guild.name} • Referral Program")
    try:
        await member.send(embed=embed)
        logger.info(f"[DM] Milestone DM sent to {member.name} ({member.id}) at {count} invites")
    except discord.errors.Forbidden:
        logger.warning(f"[DM] Cannot DM {member.name} ({member.id})")


async def grant_premium(guild: discord.Guild, user_id: int, log_ch, reason: str = "Referral Reward") -> bool:
    role   = guild.get_role(PREMIUM_ROLE_ID)
    member = guild.get_member(user_id)
    if not role or not member:
        return False
    if role in member.roles:
        return False

    expires = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=PREMIUM_DAYS)
    await member.add_roles(role, reason=reason)
    await db_execute(
        'INSERT OR REPLACE INTO premium_users (user_id, expires_at) VALUES (?,?)',
        (user_id, expires.isoformat()),
    )
    logger.info(f"[PREMIUM] Granted to {member.name} ({user_id}) — expires {expires.date()}")

    if log_ch:
        embed = discord.Embed(title="🎉 Premium Granted", color=discord.Color.gold(), timestamp=pkt_now())
        embed.add_field(name="User",     value=f"{member.mention}\n`{user_id}`", inline=True)
        embed.add_field(name="Duration", value=f"**{PREMIUM_DAYS} Days**",       inline=True)
        embed.add_field(name="Reason",   value=reason,                            inline=False)
        embed.add_field(name="Expires",  value=f"<t:{int(expires.timestamp())}:R>", inline=False)
        embed.set_footer(text="Referral System")
        await log_ch.send(embed=embed)
    return True


async def revoke_premium(guild: discord.Guild, user_id: int, log_ch, reason: str = "Expired") -> bool:
    role   = guild.get_role(PREMIUM_ROLE_ID)
    member = guild.get_member(user_id)
    await db_execute('DELETE FROM premium_users WHERE user_id=?', (user_id,))
    if member and role and role in member.roles:
        await member.remove_roles(role, reason=reason)
        logger.info(f"[PREMIUM] Revoked from {member.name} ({user_id}) — {reason}")
        if log_ch:
            embed = discord.Embed(title="⏰ Premium Removed", color=discord.Color.red(), timestamp=pkt_now())
            embed.add_field(name="User",   value=f"<@{user_id}>", inline=True)
            embed.add_field(name="Reason", value=reason,           inline=True)
            await log_ch.send(embed=embed)
        return True
    return False

# ---------------------------------------------------------------------------
# Persistent Views
# ---------------------------------------------------------------------------

class PremiumDashboard(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)

    @discord.ui.button(
        label="Get Invite Link",
        style=discord.ButtonStyle.green,
        emoji="🔗",
        custom_id="premium:create_link",
    )
    async def create_link(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.defer(ephemeral=True)
        user  = interaction.user
        guild = interaction.guild

        code  = await get_invite_code(user.id)
        count = await get_count(user.id)

        if not code:
            try:
                ch     = guild.get_channel(DASHBOARD_CHANNEL_ID) or guild.text_channels[0]
                invite = await ch.create_invite(max_age=0, max_uses=0, unique=True, reason=f"Referral — {user}")
                code   = invite.code
                await db_execute(
                    'INSERT OR REPLACE INTO referrals (user_id, invite_code, count) VALUES (?,?,0)',
                    (user.id, code),
                )
                bot_obj: ReferralBot = interaction.client
                bot_obj.invite_cache[guild.id][code] = 0
                logger.info(f"[INVITE] Created for {user.name} ({user.id}): {code}")
            except Exception as e:
                logger.error(f"[INVITE] Creation failed for {user.id}: {e}")
                await interaction.followup.send("❌ Could not create invite link. Ask an admin.", ephemeral=True)
                return

        embed = discord.Embed(
            title="🔗 Your Personal Invite Link",
            color=discord.Color.green(),
            timestamp=pkt_now(),
        )
        embed.set_author(name=user.display_name, icon_url=user.display_avatar.url)
        embed.add_field(name="Your Link",  value=f"```https://discord.gg/{code}```", inline=False)
        embed.add_field(name="Progress",   value=f"{progress_bar(min(count, INVITES_REQUIRED), INVITES_REQUIRED)}  **{count}/{INVITES_REQUIRED}**", inline=False)

        remaining = max(INVITES_REQUIRED - count, 0)
        if remaining == 0:
            embed.add_field(name="Status", value="✅ You already earned Premium! Keep inviting to renew.", inline=False)
        else:
            embed.add_field(name="Remaining", value=f"**{remaining} more** invites needed for 30 Days Free Premium", inline=False)

        embed.set_footer(text="Only real members count • Share and earn!")
        await interaction.followup.send(embed=embed, ephemeral=True)

    @discord.ui.button(
        label="My Progress",
        style=discord.ButtonStyle.blurple,
        emoji="📊",
        custom_id="premium:check_progress",
    )
    async def check_progress(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.defer(ephemeral=True)
        user  = interaction.user
        count = await get_count(user.id)
        prem  = await is_premium(user.id)
        exp   = await get_expires(user.id)

        embed = discord.Embed(
            title="📊 Your Referral Progress",
            color=discord.Color.blurple(),
            timestamp=pkt_now(),
        )
        embed.set_author(name=user.display_name, icon_url=user.display_avatar.url)

        bar = progress_bar(min(count, INVITES_REQUIRED), INVITES_REQUIRED)
        embed.add_field(name="Progress", value=f"{bar}\n**{count}/{INVITES_REQUIRED} invites**", inline=False)

        if prem and exp:
            embed.add_field(name="Premium Status", value=f"✅ Active — expires <t:{int(exp.timestamp())}:R>", inline=False)
        elif count >= INVITES_REQUIRED:
            embed.add_field(name="Premium Status", value="🎉 Goal reached! Contact admin if role not given.", inline=False)
        else:
            remaining = INVITES_REQUIRED - count
            embed.add_field(name="Premium Status", value=f"🔥 **{remaining} more** invites to unlock!", inline=False)

        milestones_text = " → ".join(
            f"~~{m}~~" if count >= m else f"**{m}**"
            for m in MILESTONES
        )
        embed.add_field(name="Milestones", value=milestones_text, inline=False)
        embed.set_footer(text="Only you can see this")
        await interaction.followup.send(embed=embed, ephemeral=True)

    @discord.ui.button(
        label="Top Inviters",
        style=discord.ButtonStyle.grey,
        emoji="🏆",
        custom_id="premium:leaderboard",
    )
    async def leaderboard_btn(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.defer(ephemeral=True)
        guild = interaction.guild
        rows  = await db_fetchall(
            'SELECT user_id, count FROM referrals ORDER BY count DESC LIMIT 10'
        )
        medals = ["🥇", "🥈", "🥉"]
        embed  = discord.Embed(
            title="🏆 Top Inviters",
            color=discord.Color.gold(),
            timestamp=pkt_now(),
        )
        lines = []
        for i, (uid, cnt) in enumerate(rows, 1):
            m      = guild.get_member(uid)
            name   = m.display_name if m else f"User {uid}"
            medal  = medals[i-1] if i <= 3 else f"`{i:02}.`"
            bar    = progress_bar(min(cnt, INVITES_REQUIRED), INVITES_REQUIRED, length=6)
            lines.append(f"{medal} **{name}** — {cnt} invites {bar}")
        embed.description = "\n".join(lines) if lines else "No invites yet! Be the first 🚀"
        embed.set_footer(text="Invite more to climb the ranks!")
        await interaction.followup.send(embed=embed, ephemeral=True)

# ---------------------------------------------------------------------------
# Bot
# ---------------------------------------------------------------------------

class ReferralBot(commands.Bot):
    def __init__(self):
        intents = discord.Intents.default()
        intents.members = True
        intents.guilds  = True
        intents.invites = True
        super().__init__(command_prefix='!', intents=intents)
        self.invite_cache: dict[int, dict[str, int]] = {}

    async def setup_hook(self) -> None:
        await init_db()
        self.add_view(PremiumDashboard())
        self.check_expiry.start()
        logger.info("[BOT] setup_hook done")

    async def on_ready(self) -> None:
        logger.info("=" * 60)
        logger.info(f"[BOT] Logged in as {self.user} ({self.user.id})")
        logger.info("=" * 60)

        guild = self.get_guild(GUILD_ID)
        if not guild:
            logger.error(f"[BOT] Guild {GUILD_ID} not found!")
            return

        # Cache invites
        try:
            invites = await guild.invites()
            self.invite_cache[guild.id] = {inv.code: inv.uses or 0 for inv in invites}
            logger.info(f"[INVITE] Cached {len(self.invite_cache[guild.id])} invites")
        except Exception as e:
            logger.error(f"[INVITE] Cache failed: {e}")
            self.invite_cache[guild.id] = {}

        await self._post_dashboard(guild)
        logger.info("[BOT] ✅ Ready!")

    async def _post_dashboard(self, guild: discord.Guild) -> None:
        ch = guild.get_channel(DASHBOARD_CHANNEL_ID)
        if not ch:
            logger.warning(f"[BOT] DASHBOARD_CHANNEL_ID {DASHBOARD_CHANNEL_ID} not found!")
            return

        pkg_lines = (
            f"1️⃣ Click **🔗 Get Invite Link** below\n"
            f"2️⃣ Share your unique link with friends\n"
            f"3️⃣ Every **{INVITES_REQUIRED} real joins** = **{PREMIUM_DAYS} Days Free Premium** 🎉\n"
            f"4️⃣ Track your progress with **📊 My Progress**"
        )

        embed = discord.Embed(
            title="🌟 Free 30 Days Premium — Invite & Earn!",
            description=(
                f"Invite **{INVITES_REQUIRED} real members** to this server and unlock "
                f"**{PREMIUM_DAYS} Days Free Premium** automatically!\n\n"
                f"**How it works:**\n{pkg_lines}\n\n"
                f"**Milestones:** 3 invites 🔔 → 6 invites 🔔 → {INVITES_REQUIRED} invites 🏆 Premium!"
            ),
            color=discord.Color.green(),
        )
        embed.set_footer(text="Real members only • Bots and alts don't count")

        try:
            # Check last message — don't repost if already there
            async for msg in ch.history(limit=5):
                if msg.author == self.user and msg.embeds:
                    logger.info(f"[BOT] Dashboard already exists in #{ch.name} — skipping")
                    return

            await ch.send(embed=embed, view=PremiumDashboard())
            logger.info(f"[BOT] Dashboard posted in #{ch.name}")
        except Exception as e:
            logger.error(f"[BOT] Dashboard post failed: {e}")

    async def on_member_join(self, member: discord.Member) -> None:
        if member.bot or member.guild.id != GUILD_ID:
            return

        guild  = member.guild
        log_ch = guild.get_channel(LOG_CHANNEL_ID)
        logger.info(f"[JOIN] {member.name} ({member.id}) joined")

        try:
            current_invites = await guild.invites()
            new_cache       = {inv.code: inv.uses or 0 for inv in current_invites}
            old_cache       = self.invite_cache.get(guild.id, {})

            # Find which invite was used
            matched_code    = None
            for code, new_uses in new_cache.items():
                if new_uses > old_cache.get(code, 0):
                    matched_code = code
                    break

            self.invite_cache[guild.id] = new_cache

            if not matched_code:
                logger.info(f"[JOIN] No invite match for {member.name}")
                return

            row = await db_fetchone('SELECT user_id, count FROM referrals WHERE invite_code=?', (matched_code,))
            if not row:
                logger.info(f"[JOIN] Invite {matched_code} not in referral system")
                return

            inviter_id, old_count = row
            new_count = old_count + 1

            await db_execute('UPDATE referrals SET count=? WHERE user_id=?', (new_count, inviter_id))
            await db_execute(
                'INSERT OR REPLACE INTO joined_via (member_id, inviter_id) VALUES (?,?)',
                (member.id, inviter_id),
            )

            inviter      = guild.get_member(inviter_id)
            inviter_name = inviter.display_name if inviter else f"ID:{inviter_id}"

            logger.info(f"[JOIN] {member.name} invited by {inviter_name} — count now {new_count}/{INVITES_REQUIRED}")

            # Log embed
            if log_ch:
                embed = discord.Embed(title="✅ Referral Tracked", color=discord.Color.green(), timestamp=pkt_now())
                embed.add_field(name="Inviter",    value=f"**{inviter_name}**\n`{inviter_id}`",      inline=True)
                embed.add_field(name="New Member", value=f"**{member.display_name}**\n`{member.id}`", inline=True)
                embed.add_field(
                    name="Progress",
                    value=f"{progress_bar(min(new_count, INVITES_REQUIRED), INVITES_REQUIRED)}  **{new_count}/{INVITES_REQUIRED}**",
                    inline=False,
                )
                embed.set_footer(text="Referral System")
                await log_ch.send(embed=embed)

            # Milestone DM
            if new_count in MILESTONES and inviter:
                asyncio.create_task(send_milestone_dm(inviter, new_count, guild))

            # Grant premium at goal
            if new_count == INVITES_REQUIRED:
                await grant_premium(guild, inviter_id, log_ch, reason="9 Referrals Reward")

        except Exception as e:
            logger.error(f"[JOIN] Error: {type(e).__name__}: {e}")

    @tasks.loop(hours=1)
    async def check_expiry(self) -> None:
        logger.info("[EXPIRY] Checking expired premiums...")
        guild = self.get_guild(GUILD_ID)
        rows  = await db_fetchall('SELECT user_id, expires_at FROM premium_users')
        now   = datetime.datetime.now(datetime.timezone.utc)
        count = 0
        for uid, exp_str in rows:
            try:
                if now >= datetime.datetime.fromisoformat(exp_str):
                    log_ch = guild.get_channel(LOG_CHANNEL_ID) if guild else None
                    await revoke_premium(guild, uid, log_ch, reason="30 Days Expired")
                    count += 1
            except Exception as e:
                logger.error(f"[EXPIRY] Error for {uid}: {e}")
        logger.info(f"[EXPIRY] Done — {count} expired")

    @check_expiry.before_loop
    async def before_expiry(self) -> None:
        await self.wait_until_ready()

# ---------------------------------------------------------------------------
# Admin Commands
# ---------------------------------------------------------------------------

bot = ReferralBot()


@bot.command(name='grantpremium')
async def grant_cmd(ctx: commands.Context, member: discord.Member) -> None:
    """Admin: manually grant premium to a user"""
    if not is_admin(ctx.author):
        await ctx.send("❌ No permission!", delete_after=5)
        return
    log_ch = ctx.guild.get_channel(LOG_CHANNEL_ID)
    ok = await grant_premium(ctx.guild, member.id, log_ch, reason=f"Manual by {ctx.author.name}")
    if ok:
        await ctx.send(f"✅ Premium granted to {member.mention} for {PREMIUM_DAYS} days!")
    else:
        await ctx.send(f"⚠️ {member.mention} already has premium or role not found.")


@bot.command(name='revokepremium')
async def revoke_cmd(ctx: commands.Context, member: discord.Member) -> None:
    """Admin: manually revoke premium"""
    if not is_admin(ctx.author):
        await ctx.send("❌ No permission!", delete_after=5)
        return
    log_ch = ctx.guild.get_channel(LOG_CHANNEL_ID)
    ok = await revoke_premium(ctx.guild, member.id, log_ch, reason=f"Manual revoke by {ctx.author.name}")
    if ok:
        await ctx.send(f"✅ Premium revoked from {member.mention}.")
    else:
        await ctx.send(f"⚠️ {member.mention} doesn't have premium.")


@bot.command(name='statuscheck')
async def status_cmd(ctx: commands.Context, member: discord.Member = None) -> None:
    """Check referral + premium status of a user"""
    target = member or ctx.author
    count  = await get_count(target.id)
    code   = await get_invite_code(target.id)
    prem   = await is_premium(target.id)
    exp    = await get_expires(target.id)

    embed = discord.Embed(
        title=f"📋 Status — {target.display_name}",
        color=discord.Color.gold() if prem else discord.Color.blurple(),
        timestamp=pkt_now(),
    )
    embed.set_thumbnail(url=target.display_avatar.url)
    embed.add_field(name="Invites",      value=f"**{count}/{INVITES_REQUIRED}**", inline=True)
    embed.add_field(name="Invite Code",  value=f"`{code}`" if code else "None",   inline=True)
    embed.add_field(
        name="Progress",
        value=progress_bar(min(count, INVITES_REQUIRED), INVITES_REQUIRED),
        inline=False,
    )
    if prem and exp:
        embed.add_field(name="Premium", value=f"✅ Active — expires <t:{int(exp.timestamp())}:R>", inline=False)
    else:
        embed.add_field(name="Premium", value="❌ Not active", inline=False)

    await ctx.send(embed=embed)


@bot.command(name='resetreferrals')
async def reset_cmd(ctx: commands.Context, member: discord.Member) -> None:
    """Admin: reset a user's referral count to 0"""
    if not is_admin(ctx.author):
        await ctx.send("❌ No permission!", delete_after=5)
        return
    await db_execute('UPDATE referrals SET count=0 WHERE user_id=?', (member.id,))
    await ctx.send(f"✅ Referral count for {member.mention} reset to 0.")
    logger.info(f"[ADMIN] {ctx.author.name} reset referrals for {member.name}")


@bot.command(name='topreferrals')
async def top_cmd(ctx: commands.Context) -> None:
    """Show top 10 inviters"""
    rows   = await db_fetchall('SELECT user_id, count FROM referrals ORDER BY count DESC LIMIT 10')
    medals = ["🥇", "🥈", "🥉"]
    embed  = discord.Embed(title="🏆 Top Inviters", color=discord.Color.gold(), timestamp=pkt_now())
    lines  = []
    for i, (uid, cnt) in enumerate(rows, 1):
        m     = ctx.guild.get_member(uid)
        name  = m.display_name if m else f"User {uid}"
        medal = medals[i-1] if i <= 3 else f"`{i:02}.`"
        lines.append(f"{medal} **{name}** — {cnt}/{INVITES_REQUIRED} invites")
    embed.description = "\n".join(lines) if lines else "No invites yet!"
    await ctx.send(embed=embed)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == '__main__':
    logger.info("=" * 60)
    logger.info(f"[STARTUP] Referral Bot starting...")
    logger.info(f"[STARTUP] Guild          : {GUILD_ID}")
    logger.info(f"[STARTUP] Dashboard Ch   : {DASHBOARD_CHANNEL_ID}")
    logger.info(f"[STARTUP] Log Ch         : {LOG_CHANNEL_ID}")
    logger.info(f"[STARTUP] Premium Role   : {PREMIUM_ROLE_ID}")
    logger.info(f"[STARTUP] Invites needed : {INVITES_REQUIRED}")
    logger.info(f"[STARTUP] Premium days   : {PREMIUM_DAYS}")
    logger.info("=" * 60)

    if BOT_TOKEN == 'YOUR_BOT_TOKEN_HERE':
        logger.critical("[STARTUP] ❌ BOT_TOKEN not set!")
        raise SystemExit("Set BOT_TOKEN before running!")

    try:
        bot.run(BOT_TOKEN)
    except KeyboardInterrupt:
        logger.info("[SHUTDOWN] Stopped by user")
    except discord.errors.LoginFailure:
        logger.critical("[STARTUP] ❌ Invalid token!")
    except Exception as e:
        logger.critical(f"[FATAL] {type(e).__name__}: {e}", exc_info=True)
