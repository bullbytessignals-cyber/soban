import asyncio
import logging
import time
import discord
from discord.ext import commands, tasks

from discord_bot import database as db
from discord_bot.config import (
    GUILD_ID, LOG_CHANNEL_ID, ADMIN_ROLE_ID, PREMIUM_ROLE_PRICES, COOLDOWN_SECONDS,
)
from discord_bot.utils import safe_api_call, get_or_create_user_channel
from discord_bot.config import CATEGORY_ID

logger = logging.getLogger(__name__)

_button_cooldowns: dict[str, float] = {}


def _check_cooldown(user_id: str) -> float:
    last = _button_cooldowns.get(user_id, 0)
    return max(COOLDOWN_SECONDS - (time.time() - last), 0)


def _is_admin(user: discord.Member, guild: discord.Guild) -> bool:
    role = guild.get_role(ADMIN_ROLE_ID)
    return bool(role and role in user.roles)


class AdminButtons(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)

    async def interaction_check(self, interaction: discord.Interaction) -> bool:
        uid = str(interaction.user.id)
        remaining = _check_cooldown(uid)
        if remaining > 0:
            await interaction.response.send_message(
                f"Please wait {remaining:.1f}s before clicking again!", ephemeral=True
            )
            return False
        _button_cooldowns[uid] = time.time()
        return True

    @discord.ui.button(
        label="Reset Balance (by ID)", style=discord.ButtonStyle.red,
        emoji="🗑️", custom_id="admin:reset_id",
    )
    async def reset_balance_id(self, interaction: discord.Interaction, button: discord.ui.Button):
        user  = interaction.user
        guild = interaction.guild

        if not _is_admin(user, guild):
            await interaction.response.send_message(
                "You don't have permission!", ephemeral=True
            )
            return

        await interaction.response.send_message(
            "Enter the user ID to reset their balance:", ephemeral=True
        )

        def check(m: discord.Message) -> bool:
            return m.author.id == user.id and m.channel.id == interaction.channel_id

        try:
            msg = await interaction.client.wait_for('message', check=check, timeout=30.0)
        except asyncio.TimeoutError:
            await interaction.followup.send("Timed out waiting for user ID.", ephemeral=True)
            return

        try:
            target_id = int(msg.content.strip())
        except ValueError:
            await interaction.followup.send("Invalid user ID format.", ephemeral=True)
            return

        await _do_reset_balance(interaction, guild, user, str(target_id))

    @discord.ui.button(
        label="Reset Balance (select)", style=discord.ButtonStyle.red,
        emoji="👤", custom_id="admin:reset_select",
    )
    async def reset_balance_select(self, interaction: discord.Interaction, button: discord.ui.Button):
        user     = interaction.user
        guild    = interaction.guild
        guild_id = str(guild.id)

        if not _is_admin(user, guild):
            await interaction.response.send_message("You don't have permission!", ephemeral=True)
            return

        rows = await db.get_all_balances(guild_id)
        if not rows:
            await interaction.response.send_message("No users with balances to reset!", ephemeral=True)
            return

        options = []
        for uid, balance in rows[:25]:
            member = guild.get_member(int(uid))
            label  = member.name if member else f"User ID {uid}"
            options.append(discord.SelectOption(
                label=label, value=uid, description=f"Balance: ${balance:.2f}"
            ))

        select = discord.ui.Select(
            placeholder="Select a user to reset their balance", options=options
        )

        async def callback(inter: discord.Interaction) -> None:
            await _do_reset_balance(inter, guild, user, select.values[0])

        select.callback = callback
        view = discord.ui.View()
        view.add_item(select)
        await interaction.response.send_message(
            "Select a user to reset their balance:", view=view, ephemeral=True
        )


async def _do_reset_balance(
    interaction: discord.Interaction,
    guild: discord.Guild,
    admin: discord.Member,
    target_user_id: str,
) -> None:
    guild_id   = str(guild.id)
    old_balance = await db.get_balance(guild_id, target_user_id)
    await db.update_balance(guild_id, target_user_id, 0.0)

    target = guild.get_member(int(target_user_id))
    mention = target.mention if target else f"User ID {target_user_id}"

    msg = f"Balance for {mention} reset to $0.00 (was ${old_balance:.2f})!"
    try:
        await interaction.response.send_message(msg, ephemeral=True)
    except discord.errors.InteractionResponded:
        await interaction.followup.send(msg, ephemeral=True)

    log_channel = guild.get_channel(LOG_CHANNEL_ID)
    if log_channel:
        await safe_api_call(log_channel.send(
            f"📢 Admin {admin.name} ({admin.id}) reset balance for {mention} "
            f"to $0.00 (was ${old_balance:.2f})"
        ))

    channel_id = await db.get_channel(guild_id, target_user_id)
    if channel_id:
        channel = guild.get_channel(int(channel_id))
        if channel:
            await safe_api_call(channel.send(
                "💸 Your balance has been reset to $0.00 by an admin. "
                "Keep inviting to earn more! 🚀"
            ))


class AdminCog(commands.Cog, name="Admin"):
    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self.recurring_commission_check.start()

    def cog_unload(self) -> None:
        self.recurring_commission_check.cancel()

    @tasks.loop(hours=24)
    async def recurring_commission_check(self) -> None:
        guild = self.bot.get_guild(GUILD_ID)
        if not guild:
            return

        guild_id     = str(guild.id)
        purchases    = await db.get_all_role_purchases(guild_id)
        current_time = int(time.time())
        one_month    = 30 * 24 * 3600

        for member_id, role_id, purchase_time in purchases:
            if current_time - purchase_time < one_month:
                continue
            member = guild.get_member(int(member_id))
            if not member or not any(r.id == int(role_id) for r in member.roles):
                continue
            inviter_id = await db.get_inviter(guild_id, member_id)
            if not inviter_id:
                continue
            inviter = guild.get_member(int(inviter_id))
            if not inviter:
                continue

            from discord_bot.cogs.affiliate import AffiliateCog
            aff_cog: AffiliateCog | None = self.bot.get_cog("Affiliate")
            if aff_cog:
                await aff_cog.notify_commission(inviter, member, int(role_id), guild)
                await db.record_role_purchase(guild_id, member_id, role_id, current_time)

    @recurring_commission_check.before_loop
    async def before_check(self) -> None:
        await self.bot.wait_until_ready()

    def _require_admin(self, ctx: commands.Context) -> bool:
        return _is_admin(ctx.author, ctx.guild)

    @commands.command()
    async def resetbalance(self, ctx: commands.Context, member: discord.Member) -> None:
        if ctx.guild.id != GUILD_ID:
            await ctx.send("This command only works in the specified server!")
            return
        if ctx.channel.id != LOG_CHANNEL_ID:
            await ctx.send(f"This command can only be used in the log channel!", delete_after=5)
            return
        if not self._require_admin(ctx):
            await ctx.send("You don't have permission! 😡")
            return

        guild_id    = str(ctx.guild.id)
        target_id   = str(member.id)
        old_balance = await db.get_balance(guild_id, target_id)
        await db.update_balance(guild_id, target_id, 0.0)
        await ctx.send(f"Balance for {member.mention} reset to $0.00 (was ${old_balance:.2f})!")

        channel_id = await db.get_channel(guild_id, target_id)
        if channel_id:
            channel = ctx.guild.get_channel(int(channel_id))
            if channel:
                await safe_api_call(channel.send(
                    "💸 Your balance has been reset to $0.00 by an admin. Keep inviting! 🚀"
                ))

    @commands.command()
    async def listbalances(self, ctx: commands.Context) -> None:
        if ctx.guild.id != GUILD_ID:
            await ctx.send("This command only works in the specified server!")
            return
        if not self._require_admin(ctx):
            await ctx.send("You don't have permission! 😡")
            return

        rows = await db.get_all_balances(str(ctx.guild.id))
        if not rows:
            await ctx.send("No balances recorded yet!")
            return

        embed = discord.Embed(title="All User Balances 💸", color=discord.Color.blue())
        for uid, balance in rows:
            m = ctx.guild.get_member(int(uid))
            embed.add_field(
                name=f"{m.name if m else uid} ({uid})",
                value=f"Balance: ${balance:.2f}",
                inline=False,
            )
        embed.set_footer(text="Admin-only command")
        await safe_api_call(ctx.send(embed=embed))


async def setup(bot: commands.Bot) -> None:
    await bot.add_cog(AdminCog(bot))
