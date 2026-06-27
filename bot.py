import asyncio
import datetime
import logging
import os
import sys

import discord
import psutil
from discord.ext import commands

# Pakistan Standard Time logging
logging.Formatter.converter = lambda *args: (
    datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=5))).timetuple()
)

from discord_bot.config import (
    BOT_TOKEN, GUILD_ID, CHALLENGE_CHANNEL_ID, LOG_CHANNEL_ID,
    PREMIUM_ROLE_PRICES, LOG_FILE,
)
from discord_bot import database as db
from discord_bot.utils import safe_api_call
from discord_bot.cogs.affiliate import AffiliateButtons
from discord_bot.cogs.admin import AdminButtons

os.makedirs(os.path.dirname(LOG_FILE) or '.', exist_ok=True)

logging.basicConfig(
    filename=LOG_FILE,
    level=logging.INFO,
    format='%(asctime)s:%(levelname)s:%(name)s:%(message)s',
)
logger = logging.getLogger(__name__)

COGS = [
    'discord_bot.cogs.affiliate',
    'discord_bot.cogs.admin',
]


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
        await db.init_db()
        for cog in COGS:
            await self.load_extension(cog)
            logger.info(f"Loaded cog: {cog}")
        # Register persistent views so buttons survive restarts
        self.add_view(AffiliateButtons())
        self.add_view(AdminButtons())

    async def on_ready(self) -> None:
        guild = self.get_guild(GUILD_ID)
        if guild:
            logger.info(f"Connected to guild: {guild.name} ({guild.id})")
            try:
                invites = await safe_api_call(guild.invites())
                guild_id = str(guild.id)
                self.invite_cache[guild_id] = {
                    inv.code: {'uses': inv.uses, 'inviter_id': str(inv.inviter.id)}
                    for inv in invites if inv.inviter
                }
                for inv in invites:
                    if inv.inviter:
                        await db.update_invites(guild_id, str(inv.inviter.id), inv.uses)
                logger.info(f"Cached {len(self.invite_cache[guild_id])} invites")
            except Exception as e:
                logger.error(f"Failed to cache invites: {e}")

            channel = self.get_channel(CHALLENGE_CHANNEL_ID)
            if channel:
                try:
                    embed = discord.Embed(
                        title="Affiliate Program - Earn Reward Commission 🏆💸",
                        description=(
                            "Ready to become a legend? Join the Affiliate Program and invite people!\n"
                            "Earn epic rewards + **50% commissions** on premium package purchases **every month**!\n\n"
                            "**Milestones**:\n"
                            "- **10 invites**: 1-month Basic Premium Access 🌟\n"
                            "- **100 invites**: Lifetime Full Server Access 🏆\n\n"
                            "**Plus**: Get **50% of every premium package purchase** by your invited members, "
                            "**every month** they renew!\n\n"
                            "Click below to start or stop. Updates go to your private channel! 🚀"
                        ),
                        color=discord.Color.dark_green(),
                    )
                    embed.set_footer(text="No limits, just invites! 🚀")
                    await safe_api_call(channel.send(embed=embed, view=AffiliateButtons()))
                except Exception as e:
                    logger.error(f"Failed to post affiliate embed: {e}")

            log_channel = self.get_channel(LOG_CHANNEL_ID)
            if log_channel:
                try:
                    admin_embed = discord.Embed(
                        title="Admin Controls",
                        description=(
                            "Use the buttons below or `!resetbalance @user` to reset user balances."
                        ),
                        color=discord.Color.red(),
                    )
                    await safe_api_call(log_channel.send(embed=admin_embed, view=AdminButtons()))
                except Exception as e:
                    logger.error(f"Failed to post admin embed: {e}")

        logger.info(f"Bot ready as {self.user}")

    async def on_command(self, ctx: commands.Context) -> None:
        logger.info(f"Command '{ctx.command}' by {ctx.author.name} ({ctx.author.id})")
        cpu = psutil.cpu_percent()
        mem = psutil.virtual_memory().percent
        if cpu > 80 or mem > 80:
            logger.warning(f"High resource usage — CPU: {cpu}% | Memory: {mem}%")

    async def on_command_error(self, ctx: commands.Context, error: Exception) -> None:
        if isinstance(error, commands.MissingRequiredArgument):
            await ctx.send(f"Missing argument: `{error.param.name}`. Check `!help {ctx.command}`.")
        elif isinstance(error, commands.MemberNotFound):
            await ctx.send("Member not found. Make sure to @mention them.")
        else:
            logger.error(f"Unhandled error in '{ctx.command}': {error}")


async def main() -> None:
    bot = SobanBot()
    async with bot:
        await bot.start(BOT_TOKEN)


if __name__ == '__main__':
    asyncio.run(main())
