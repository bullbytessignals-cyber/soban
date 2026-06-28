import discord
from discord.ext import commands
import asyncio
import json
from datetime import datetime, timedelta

# ==== CONFIGURATION ====
TOKEN = "YOUR_BOT_TOKEN_HERE"  # <-- yahan apna Discord bot token likho

CHANNEL_ID = 1383471213350752367
TRIAL_ROLE_ID = 1404171608402432090
TRIAL_DURATION_SECONDS = 480       # 8 minutes
COOLDOWN_DAYS = 7                  # User can claim again after 7 days
DATA_FILE = "trial_data.json"      # Persistent storage
# ========================

intents = discord.Intents.default()
intents.members = True

bot = commands.Bot(command_prefix="!", intents=intents)


# ---------- helper functions ----------

def load_data() -> dict:
    try:
        with open(DATA_FILE, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return {}


def save_data(data: dict):
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=2)


def get_cooldown_remaining(user_id: str) -> timedelta | None:
    """Return remaining cooldown timedelta, or None if user can claim."""
    data = load_data()
    if user_id not in data:
        return None
    last_claim = datetime.fromisoformat(data[user_id])
    next_allowed = last_claim + timedelta(days=COOLDOWN_DAYS)
    now = datetime.utcnow()
    if now < next_allowed:
        return next_allowed - now
    return None


def record_claim(user_id: str):
    data = load_data()
    data[user_id] = datetime.utcnow().isoformat()
    save_data(data)


def format_timedelta(td: timedelta) -> str:
    total_seconds = int(td.total_seconds())
    days = total_seconds // 86400
    hours = (total_seconds % 86400) // 3600
    minutes = (total_seconds % 3600) // 60
    parts = []
    if days:
        parts.append(f"{days}d")
    if hours:
        parts.append(f"{hours}h")
    if minutes:
        parts.append(f"{minutes}m")
    return " ".join(parts) if parts else "less than a minute"


# ---------- persistent view ----------

class FreeTrialView(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)

    @discord.ui.button(label="🎁 Free Trial", style=discord.ButtonStyle.success, custom_id="free_trial_button")
    async def free_trial_button(self, interaction: discord.Interaction, button: discord.ui.Button):
        user = interaction.user
        guild = interaction.guild
        role = guild.get_role(TRIAL_ROLE_ID)
        user_id = str(user.id)

        if role is None:
            await interaction.response.send_message("❌ Role not found! Contact admin.", ephemeral=True)
            return

        # Check 7-day cooldown
        remaining = get_cooldown_remaining(user_id)
        if remaining is not None:
            await interaction.response.send_message(
                f"⏳ You can claim your next trial in **{format_timedelta(remaining)}**.",
                ephemeral=True
            )
            return

        # Check if user already has the role active right now
        if role in user.roles:
            await interaction.response.send_message(
                "⏳ Your trial is already active!",
                ephemeral=True
            )
            return

        # Grant role and record claim time
        await user.add_roles(role)
        record_claim(user_id)
        await interaction.response.send_message(
            "✅ You have been given an **8-minute Free Trial**! Enjoy 🎉",
            ephemeral=True
        )
        print(f"[+] Role assigned to: {user.name} | ID: {user.id}")

        # Remove role after trial duration
        await asyncio.sleep(TRIAL_DURATION_SECONDS)

        try:
            member = await guild.fetch_member(user.id)
            if role in member.roles:
                await member.remove_roles(role)
                print(f"[-] Role removed from: {member.name} | ID: {member.id}")
        except discord.NotFound:
            print(f"[!] Member {user.id} not found when removing role.")
        except Exception as e:
            print(f"[!] Error removing role: {e}")


# ---------- bot events ----------

async def setup_hook():
    bot.add_view(FreeTrialView())
    print("Persistent view registered!")

bot.setup_hook = setup_hook


@bot.event
async def on_ready():
    print(f"✅ Logged in as {bot.user}")
    channel = bot.get_channel(CHANNEL_ID)

    if channel is None:
        print(f"[ERROR] Channel {CHANNEL_ID} not found!")
        return

    embed = discord.Embed(
        title="🎉 Claim Your Free Trial!",
        description=(
            "Click the button below to get an **8-minute Free Trial** role.\n"
            f"⚠️ You can only claim **once every {COOLDOWN_DAYS} days**!"
        ),
        color=discord.Color.red()
    )
    embed.set_image(url="https://i.ibb.co/CpnqQFjZ/Red-and-White-Modern-Bold-Social-Media-Special-Media-Specialist-Portofolio-Presentation.png")

    # NOTE: Comment out the line below after first run to avoid duplicate messages on restart.
    await channel.send(embed=embed, view=FreeTrialView())

    print("Message with button sent!")


bot.run(TOKEN)
