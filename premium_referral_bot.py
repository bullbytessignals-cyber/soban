import discord
from discord.ext import commands, tasks
import sqlite3
import os
from datetime import datetime, timedelta, timezone

# ==================== CONFIG ====================
BOT_TOKEN = os.environ["BOT_TOKEN"]
GUILD_ID = 1348248729878134885
DASHBOARD_CHANNEL_ID = 1483221485664469123
ROLE_ID = 1399925083492847727
LOG_CHANNEL_ID = 1502778641870749917
DB_NAME = "premium_referrals_new.db"

REQUIRED_INVITES = 9  # invites needed for premium

# ==================== BOT SETUP ====================
intents = discord.Intents.default()
intents.members = True
intents.guilds = True
intents.invites = True

bot = commands.Bot(command_prefix="!", intents=intents)
invite_cache = {}


def get_db():
    return sqlite3.connect(DB_NAME)


# ==================== PERSISTENT DASHBOARD VIEW ====================
class PremiumDashboard(discord.ui.View):
    def __init__(self, bot):
        super().__init__(timeout=None)
        self.bot = bot

    @discord.ui.button(label="🎟 Create Invite Link", style=discord.ButtonStyle.green, emoji="🔗", custom_id="premium:create_link")
    async def create_link(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.defer(ephemeral=True)
        user_id = interaction.user.id
        guild = interaction.guild

        conn = get_db()
        c = conn.cursor()
        c.execute("SELECT invite_code, referral_count FROM referrals WHERE user_id = ?", (user_id,))
        row = c.fetchone()

        if row:
            code, count = row
            embed = discord.Embed(
                title="🎉 Your Personal Invite Link",
                description=f"**Link:**\n`https://discord.gg/{code}`\n\n**Progress:** `{count}/{REQUIRED_INVITES}`",
                color=0x00FF88
            )
        else:
            try:
                channel = guild.get_channel(DASHBOARD_CHANNEL_ID)
                invite = await channel.create_invite(max_age=0, max_uses=0, unique=True, reason=f"Referral - {interaction.user}")
                code = invite.code

                c.execute("INSERT INTO referrals (user_id, invite_code, referral_count) VALUES (?, ?, 0)", (user_id, code))
                conn.commit()

                embed = discord.Embed(
                    title="✅ Invite Link Created!",
                    description=f"**Your Link:**\n`https://discord.gg/{code}`\n\n{REQUIRED_INVITES} members invite karke 30 Days Premium pao.",
                    color=0x00FF88
                )
            except Exception:
                await interaction.followup.send("❌ Error creating link.", ephemeral=True)
                conn.close()
                return

        embed.set_footer(text="Real Members Only")
        await interaction.followup.send(embed=embed, ephemeral=True)
        conn.close()

    @discord.ui.button(label="📊 Check Progress", style=discord.ButtonStyle.blurple, emoji="📈", custom_id="premium:check_progress")
    async def check_progress(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.defer(ephemeral=True)
        user_id = interaction.user.id

        conn = get_db()
        c = conn.cursor()
        c.execute("SELECT referral_count FROM referrals WHERE user_id = ?", (user_id,))
        row = c.fetchone()
        conn.close()

        count = row[0] if row else 0
        embed = discord.Embed(title="📊 Your Referral Progress", color=0x00FF88)
        embed.add_field(name="Invited", value=f"**{count}**", inline=True)
        embed.add_field(name="Target", value=f"**{REQUIRED_INVITES}**", inline=True)
        embed.add_field(
            name="Status",
            value="🎊 Premium Active (30 Days)" if count >= REQUIRED_INVITES else "🔥 Keep Inviting!",
            inline=False
        )

        await interaction.followup.send(embed=embed, ephemeral=True)


# ==================== EVENTS ====================
@bot.event
async def on_ready():
    print(f"✅ Bot Ready - {bot.user}")

    conn = get_db()
    c = conn.cursor()
    c.execute("""CREATE TABLE IF NOT EXISTS referrals (
                    user_id INTEGER PRIMARY KEY,
                    invite_code TEXT UNIQUE,
                    referral_count INTEGER DEFAULT 0)""")
    c.execute("""CREATE TABLE IF NOT EXISTS premium_users (
                    user_id INTEGER PRIMARY KEY,
                    expires_at TEXT)""")
    conn.commit()
    conn.close()

    await cache_invites()
    bot.add_view(PremiumDashboard(bot))
    await setup_dashboard()

    print("✅ Premium Referral System Loaded!")


async def cache_invites():
    global invite_cache
    guild = bot.get_guild(GUILD_ID)
    if guild:
        invites = await guild.invites()
        invite_cache = {inv.code: inv.uses or 0 for inv in invites}
        print(f"📥 {len(invite_cache)} invites cached.")


async def setup_dashboard():
    channel = bot.get_channel(DASHBOARD_CHANNEL_ID)
    if not channel:
        return

    embed = discord.Embed(
        title="🌟 Get Free 30 Days Premium!",
        description=f"Invite **{REQUIRED_INVITES} real members** and get Premium Role automatically.",
        color=0x00FF88
    )
    embed.add_field(
        name="How it Works",
        value=f"1. Create Invite Link\n2. Share your link\n3. {REQUIRED_INVITES} joins = 30 Days Premium",
        inline=False
    )

    await channel.purge(limit=10)
    await channel.send(embed=embed, view=PremiumDashboard(bot))


@bot.event
async def on_member_join(member: discord.Member):
    if member.bot or member.guild.id != GUILD_ID:
        return

    guild = member.guild
    log_ch = guild.get_channel(LOG_CHANNEL_ID)

    try:
        current_invites = await guild.invites()
        current_uses = {inv.code: inv.uses or 0 for inv in current_invites}

        conn = get_db()
        c = conn.cursor()

        for code, new_uses in current_uses.items():
            old_uses = invite_cache.get(code, 0)

            if new_uses > old_uses:
                diff = new_uses - old_uses
                c.execute("SELECT user_id, referral_count FROM referrals WHERE invite_code = ?", (code,))
                row = c.fetchone()

                if row:
                    inviter_id, old_count = row
                    new_count = old_count + diff

                    c.execute("UPDATE referrals SET referral_count = ? WHERE user_id = ?", (new_count, inviter_id))
                    conn.commit()

                    inviter = guild.get_member(inviter_id)
                    inviter_name = inviter.display_name if inviter else f"ID:{inviter_id}"
                    member_name = member.display_name

                    embed = discord.Embed(title="✅ Referral Tracked", color=0x00FF88)
                    embed.add_field(name="Inviter", value=f"{inviter_name}\n`{inviter_id}`", inline=False)
                    embed.add_field(name="New Member", value=f"{member_name}\n`{member.id}`", inline=False)
                    embed.add_field(name="Progress", value=f"`{new_count}/{REQUIRED_INVITES}`", inline=False)
                    embed.set_footer(text="Referral System")

                    if log_ch:
                        await log_ch.send(embed=embed)

                    if new_count >= REQUIRED_INVITES:
                        await grant_premium(guild, inviter_id, log_ch, conn, c)

                    invite_cache[code] = new_uses
                    break

        conn.close()

    except Exception as e:
        print(f"Join Error: {e}")


async def grant_premium(guild, user_id, log_ch, conn, cursor):
    role = guild.get_role(ROLE_ID)
    member = guild.get_member(user_id)

    if role and member and role not in member.roles:
        try:
            await member.add_roles(role)
            expires = datetime.now(timezone.utc) + timedelta(days=30)

            cursor.execute(
                "INSERT OR REPLACE INTO premium_users (user_id, expires_at) VALUES (?, ?)",
                (user_id, expires.isoformat())
            )
            conn.commit()

            if log_ch:
                embed = discord.Embed(title="🎉 Premium Granted", color=0xFFD700)
                embed.add_field(name="User", value=f"{member.display_name}\n`{user_id}`", inline=False)
                embed.add_field(name="Duration", value="**30 Days**", inline=False)
                embed.set_footer(text="Referral Reward")
                await log_ch.send(embed=embed)
        except Exception:
            pass


# ==================== AUTO EXPIRY ====================
@tasks.loop(hours=1)
async def check_expiry():
    now = datetime.now(timezone.utc)
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT user_id, expires_at FROM premium_users")

    for user_id, exp_str in c.fetchall():
        try:
            if now >= datetime.fromisoformat(exp_str):
                guild = bot.get_guild(GUILD_ID)
                if guild:
                    member = guild.get_member(user_id)
                    role = guild.get_role(ROLE_ID)
                    if member and role:
                        await member.remove_roles(role)

                c.execute("DELETE FROM premium_users WHERE user_id = ?", (user_id,))
                conn.commit()

                log_ch = guild.get_channel(LOG_CHANNEL_ID) if guild else None
                if log_ch:
                    embed = discord.Embed(title="⏰ Premium Expired", color=0xFF0000)
                    embed.add_field(name="User", value=f"<@{user_id}>", inline=False)
                    embed.add_field(name="Status", value="Premium Role Removed", inline=False)
                    await log_ch.send(embed=embed)
        except Exception:
            continue

    conn.close()


@bot.event
async def setup_hook():
    check_expiry.start()


bot.run(BOT_TOKEN)
