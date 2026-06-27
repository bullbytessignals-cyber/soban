import asyncio
import logging
import time
import discord
from discord.ext import commands

from discord_bot import database as db
from discord_bot.config import (
    GUILD_ID, CHALLENGE_CHANNEL_ID, LOG_CHANNEL_ID,
    CATEGORY_ID, AFFILIATER_ROLE_ID, FULL_ACCESS_ROLE_ID,
    PREMIUM_ROLE_PRICES, COOLDOWN_SECONDS,
)
from discord_bot.utils import safe_api_call, get_or_create_user_channel

logger = logging.getLogger(__name__)

_button_cooldowns: dict[str, float] = {}


def _check_cooldown(user_id: str) -> float:
    """Returns remaining cooldown seconds; 0 if ready."""
    last = _button_cooldowns.get(user_id, 0)
    remaining = COOLDOWN_SECONDS - (time.time() - last)
    return max(remaining, 0)


class AffiliateButtons(discord.ui.View):
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
        label="Start Affiliate Program", style=discord.ButtonStyle.green,
        emoji="🚀", custom_id="affiliate:start",
    )
    async def start_affiliate(self, interaction: discord.Interaction, button: discord.ui.Button):
        user     = interaction.user
        guild    = interaction.guild
        guild_id = str(guild.id)
        user_id  = str(user.id)

        if guild.id != GUILD_ID:
            await interaction.response.send_message(
                "This command only works in the specified server!", ephemeral=True
            )
            return

        await interaction.response.defer(ephemeral=True)

        if await db.is_affiliate(guild_id, user_id):
            await interaction.followup.send(
                "You're already an Affiliate Partner! Keep rocking it! 😎", ephemeral=True
            )
            return

        await db.update_invites(guild_id, user_id, 0)
        await db.update_invited_member(guild_id, user_id, None)

        affiliater_role = guild.get_role(AFFILIATER_ROLE_ID)
        if affiliater_role and affiliater_role not in user.roles:
            try:
                await safe_api_call(user.add_roles(affiliater_role))
            except Exception as e:
                logger.error(f"Failed to assign Affiliater role to {user_id}: {e}")

        channel = await get_or_create_user_channel(user, guild, CATEGORY_ID, LOG_CHANNEL_ID)
        if not channel:
            await interaction.followup.send(
                "Couldn't create your channel. Ask an admin to check permissions!", ephemeral=True
            )
            return

        try:
            invite_src = guild.get_channel(CHALLENGE_CHANNEL_ID) or guild.text_channels[0]
            invite = await safe_api_call(invite_src.create_invite(max_age=0, unique=True))
        except Exception as e:
            logger.error(f"Failed to create invite for {user_id}: {e}")
            await interaction.followup.send(
                "Can't create invites! Ask an admin to fix my permissions! 😢", ephemeral=True
            )
            return

        await db.update_user_invite(guild_id, user_id, invite.code)
        await db.update_affiliate(guild_id, user_id, 1)

        embed = discord.Embed(
            title="Welcome To The Affiliate Program! 🚀💸",
            description=(
                f"Time To Make It Rain, {user.mention}!\n"
                f"Invite people to earn **Epic Rewards** and **50% commissions** on every "
                f"Premium Package purchase.\n\n"
                f"Your progress updates will land here.\n"
                f"Here's your **Referral Invite Link**:\n# **{invite.url}**"
            ),
            color=discord.Color.dark_green(),
        )
        embed.set_footer(text="No limits, just invites! 🏆")

        try:
            await safe_api_call(channel.send(embed=embed))
            await interaction.followup.send(
                "You're in! Check your private channel for your invite link! 🎉", ephemeral=True
            )
            log_channel = guild.get_channel(LOG_CHANNEL_ID)
            if log_channel:
                await safe_api_call(log_channel.send(
                    f"📢 {user.name} ({user_id}) joined the Affiliate Program! Invite: {invite.url}"
                ))
        except Exception as e:
            logger.error(f"Failed to send welcome message for {user_id}: {e}")
            await interaction.followup.send(
                "Can't send to your channel! Ask an admin to check permissions!", ephemeral=True
            )

    @discord.ui.button(
        label="Stop Affiliate Program", style=discord.ButtonStyle.red,
        emoji="🛑", custom_id="affiliate:stop",
    )
    async def stop_affiliate(self, interaction: discord.Interaction, button: discord.ui.Button):
        user     = interaction.user
        guild    = interaction.guild
        guild_id = str(guild.id)
        user_id  = str(user.id)

        if guild.id != GUILD_ID:
            await interaction.response.send_message(
                "This command only works in the specified server!", ephemeral=True
            )
            return

        await interaction.response.defer(ephemeral=True)

        if not await db.is_affiliate(guild_id, user_id):
            await interaction.followup.send(
                "You're not in the Affiliate Program! Click 'Start Affiliate Program' to join!", ephemeral=True
            )
            return

        channel_id = await db.get_channel(guild_id, user_id)
        channel = guild.get_channel(int(channel_id)) if channel_id else None

        if channel:
            try:
                await safe_api_call(channel.send(
                    f"{user.mention}, you stopped the Affiliate Program! Epic hustle, come back anytime! 🛑"
                ))
                await safe_api_call(channel.delete())
            except Exception as e:
                logger.error(f"Failed to delete channel for {user_id}: {e}")
                await interaction.followup.send(
                    "Can't delete your channel! Ask an admin to check permissions!", ephemeral=True
                )
                return

        affiliater_role = guild.get_role(AFFILIATER_ROLE_ID)
        if affiliater_role and affiliater_role in user.roles:
            try:
                await safe_api_call(user.remove_roles(affiliater_role))
            except Exception as e:
                logger.error(f"Failed to remove Affiliater role from {user_id}: {e}")

        await db.delete_affiliate_data(guild_id, user_id)

        log_channel = guild.get_channel(LOG_CHANNEL_ID)
        if log_channel:
            await safe_api_call(log_channel.send(
                f"📢 {user.name} ({user_id}) stopped the Affiliate Program!"
            ))

        await interaction.followup.send(
            "Affiliate Program stopped! Your private channel is gone. Start again anytime! 🚀",
            ephemeral=True,
        )


class AffiliateCog(commands.Cog, name="Affiliate"):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    async def update_user_channel(
        self,
        inviter: discord.Member,
        guild: discord.Guild,
        invites: int,
        invited_member: discord.Member | None = None,
    ) -> None:
        guild_id = str(guild.id)
        user_id  = str(inviter.id)
        channel  = await get_or_create_user_channel(inviter, guild, CATEGORY_ID, LOG_CHANNEL_ID)
        if not channel:
            return

        balance = await db.get_balance(guild_id, user_id)
        embed = discord.Embed(
            title="Affiliate Progress Update! 🚀",
            description=(
                f"Hey {inviter.mention}, you've invited **{invites}** member(s)! 🎉\n"
                f"Your current balance is **${balance:.2f}**.\n"
                f"Keep inviting to unlock more rewards! 💪"
                + ("\nWOW! You've hit 100 invites! You're a LEGEND! 😎" if invites >= 100 else "")
            ),
            color=discord.Color.dark_green(),
        )
        if invited_member:
            embed.add_field(name="New Member", value=invited_member.name, inline=False)
        embed.set_footer(text="No limits! 🏆")

        try:
            await safe_api_call(channel.send(embed=embed))
            log_channel = guild.get_channel(LOG_CHANNEL_ID)
            if log_channel:
                msg = f"📢 {inviter.name} ({user_id}) invited {invites} member(s)! Balance: ${balance:.2f}"
                if invited_member:
                    msg += f" | New Member: {invited_member.name} ({invited_member.id})"
                await safe_api_call(log_channel.send(msg))
        except Exception as e:
            logger.error(f"Failed to send update for {user_id}: {e}")

    async def notify_commission(
        self,
        inviter: discord.Member,
        new_member: discord.Member,
        role_id: int,
        guild: discord.Guild,
    ) -> None:
        guild_id  = str(guild.id)
        inviter_id = str(inviter.id)

        if not await db.is_affiliate(guild_id, inviter_id):
            return

        channel = await get_or_create_user_channel(inviter, guild, CATEGORY_ID, LOG_CHANNEL_ID)
        if not channel:
            return

        role       = guild.get_role(role_id)
        role_name  = role.name if role else f"Role ID {role_id}"
        price      = PREMIUM_ROLE_PRICES.get(role_id, 0.0)
        commission = price * 0.5

        current = await db.get_balance(guild_id, inviter_id)
        await db.update_balance(guild_id, inviter_id, current + commission)
        await db.record_role_purchase(guild_id, str(new_member.id), str(role_id), int(time.time()))

        new_balance = await db.get_balance(guild_id, inviter_id)
        embed = discord.Embed(
            title="Cha-Ching! Affiliate Commission Earned! 💸",
            description=(
                f"BOOM! {new_member.name} bought the **{role_name}** package, {inviter.mention}! 🎉\n"
                f"You earned a **50% commission** of **${commission:.2f}**! 🤑\n"
                f"Your total balance is now **${new_balance:.2f}**.\n"
                f"Contact an admin to claim your cash! 💪"
            ),
            color=discord.Color.dark_green(),
        )
        embed.set_footer(text="You're raking it in! 🚀")

        try:
            await safe_api_call(channel.send(embed=embed))
            log_channel = guild.get_channel(LOG_CHANNEL_ID)
            if log_channel:
                await safe_api_call(log_channel.send(
                    f"📢 {inviter.name} ({inviter_id}) earned ${commission:.2f} commission! "
                    f"New balance: ${new_balance:.2f}. "
                    f"New Member: {new_member.name} ({new_member.id}) purchased {role_name}."
                ))
        except Exception as e:
            logger.error(f"Failed to notify commission for {inviter_id}: {e}")

    async def check_milestones(
        self, inviter: discord.Member, invites: int, guild: discord.Guild
    ) -> None:
        guild_id = str(guild.id)
        user_id  = str(inviter.id)
        channel  = await get_or_create_user_channel(inviter, guild, CATEGORY_ID, LOG_CHANNEL_ID)
        if not channel:
            return

        lowest_role_id = min(PREMIUM_ROLE_PRICES)
        premium_role   = guild.get_role(lowest_role_id)
        full_access    = guild.get_role(FULL_ACCESS_ROLE_ID)
        log_channel    = guild.get_channel(LOG_CHANNEL_ID)

        try:
            if invites >= 10 and premium_role and premium_role not in inviter.roles:
                reward = PREMIUM_ROLE_PRICES[lowest_role_id]
                await safe_api_call(inviter.add_roles(premium_role))
                balance = await db.get_balance(guild_id, user_id)
                await db.update_balance(guild_id, user_id, balance + reward)
                new_bal = await db.get_balance(guild_id, user_id)
                await safe_api_call(channel.send(
                    f"🎉 {inviter.mention}, you hit 10 invites! Unlocked **1-month {premium_role.name} Access** "
                    f"(worth ${reward:.2f})! 🔥\nNew balance: ${new_bal:.2f}"
                ))
                if log_channel:
                    await safe_api_call(log_channel.send(
                        f"📢 {inviter.name} ({user_id}) hit 10 invites → {premium_role.name}. Balance: ${new_bal:.2f}"
                    ))

            if invites >= 100 and full_access and full_access not in inviter.roles:
                await safe_api_call(inviter.add_roles(full_access))
                bal = await db.get_balance(guild_id, user_id)
                await safe_api_call(channel.send(
                    f"🎉 {inviter.mention}, you conquered 100 invites! Unlocked **Lifetime Full Server Access**! 🏆\n"
                    f"Balance: ${bal:.2f}"
                ))
                if log_channel:
                    await safe_api_call(log_channel.send(
                        f"📢 {inviter.name} ({user_id}) hit 100 invites → Lifetime Full Access."
                    ))
        except Exception as e:
            logger.error(f"Milestone error for {user_id}: {e}")
            await safe_api_call(channel.send(
                "Oops! Couldn't assign your milestone role. Ask an admin to check my permissions! 😅"
            ))

    @commands.Cog.listener()
    async def on_member_join(self, member: discord.Member) -> None:
        guild = member.guild
        if guild.id != GUILD_ID:
            return

        guild_id = str(guild.id)
        try:
            current_invites = await safe_api_call(guild.invites())
            new_cache = {
                inv.code: {'uses': inv.uses, 'inviter_id': str(inv.inviter.id)}
                for inv in current_invites if inv.inviter
            }

            invite_cache: dict = self.bot.invite_cache.get(guild_id, {})
            user_invite_rows   = await db.get_all_user_invites(guild_id)

            matched = False
            for uid, code in user_invite_rows:
                old_uses = invite_cache.get(code, {}).get('uses', 0)
                new_uses = new_cache.get(code, {}).get('uses', 0)
                if new_uses > old_uses:
                    await db.update_invites(guild_id, uid, new_uses)
                    inviter = guild.get_member(int(uid))
                    if inviter:
                        await db.update_invited_member(guild_id, str(member.id), uid)
                        asyncio.create_task(
                            self.update_user_channel(inviter, guild, new_uses, invited_member=member)
                        )
                        asyncio.create_task(self.check_milestones(inviter, new_uses, guild))
                    matched = True
                    break

            if not matched:
                logger.info(f"No matching invite for {member.name} ({member.id})")

            self.bot.invite_cache[guild_id] = new_cache
        except Exception as e:
            logger.error(f"on_member_join error for {member.id}: {e}")

    @commands.Cog.listener()
    async def on_member_update(self, before: discord.Member, after: discord.Member) -> None:
        if after.guild.id != GUILD_ID:
            return

        guild_id  = str(after.guild.id)
        member_id = str(after.id)
        new_roles = set(after.roles) - set(before.roles)

        for role in new_roles:
            if role.id in PREMIUM_ROLE_PRICES:
                inviter_id = await db.get_inviter(guild_id, member_id)
                if inviter_id:
                    inviter = after.guild.get_member(int(inviter_id))
                    if inviter:
                        asyncio.create_task(
                            self.notify_commission(inviter, after, role.id, after.guild)
                        )

    @commands.command()
    async def checkinvites(self, ctx: commands.Context) -> None:
        if ctx.guild.id != GUILD_ID:
            await ctx.send("This command only works in the specified server!")
            return
        guild_id = str(ctx.guild.id)
        user_id  = str(ctx.author.id)
        invites  = await db.get_invites(guild_id, user_id)
        balance  = await db.get_balance(guild_id, user_id)
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

    @commands.command()
    async def checkbalance(self, ctx: commands.Context) -> None:
        if ctx.guild.id != GUILD_ID:
            await ctx.send("This command only works in the specified server!")
            return
        balance = await db.get_balance(str(ctx.guild.id), str(ctx.author.id))
        embed = discord.Embed(
            title="Your Affiliate Balance 💸",
            description=(
                f"Hey {ctx.author.mention}, your current balance is **${balance:.2f}**! 🤑\n"
                f"Contact an admin to claim your earnings! 🚀"
            ),
            color=discord.Color.dark_green(),
        )
        embed.set_footer(text="No limits! 🏆")
        await safe_api_call(ctx.send(embed=embed))

    @commands.command()
    async def leaderboard(self, ctx: commands.Context) -> None:
        if ctx.guild.id != GUILD_ID:
            await ctx.send("This command only works in the specified server!")
            return
        rows = await db.get_top_inviters(str(ctx.guild.id))
        embed = discord.Embed(title="🏆 Affiliate Leaderboard 🏆", color=discord.Color.dark_green())
        for idx, (uid, inv_count) in enumerate(rows, 1):
            member  = ctx.guild.get_member(int(uid))
            balance = await db.get_balance(str(ctx.guild.id), uid)
            name    = member.name if member else uid
            embed.add_field(
                name=f"{idx}. {name}",
                value=f"{inv_count} invites | Balance: ${balance:.2f}",
                inline=False,
            )
        if not rows:
            embed.description = "No invites yet! Start inviting! 🚀"
        embed.set_footer(text="No limits! Claim the top spot! 😎")
        await safe_api_call(ctx.send(embed=embed))

    @commands.command()
    async def checkchannel(self, ctx: commands.Context) -> None:
        if ctx.guild.id != GUILD_ID:
            await ctx.send("This command only works in the specified server!")
            return
        guild_id   = str(ctx.guild.id)
        user_id    = str(ctx.author.id)
        channel_id = await db.get_channel(guild_id, user_id)
        if not channel_id:
            await ctx.send("No private channel yet! Click 'Start Affiliate Program' to get started! 😎")
            return
        channel = ctx.guild.get_channel(int(channel_id))
        if not channel:
            await ctx.send("Your channel is missing! Click 'Start Affiliate Program' to create a new one! 🚀")
            return
        perms = channel.permissions_for(ctx.author)
        if perms.read_messages and perms.send_messages:
            await ctx.send(f"Your private channel: {channel.name} ({channel.id}). Check your progress! 🚀")
        else:
            try:
                await safe_api_call(channel.set_permissions(
                    ctx.author,
                    read_messages=True, read_message_history=True,
                    send_messages=True, attach_files=True, send_voice_messages=True,
                ))
                await ctx.send(f"Permissions fixed! Check out {channel.name} now! 🎉")
            except Exception as e:
                logger.error(f"Failed to fix permissions for {user_id}: {e}")
                await ctx.send("Couldn't fix permissions! Ask an admin to help! 😢")

    @commands.command()
    async def roast(self, ctx: commands.Context, member: discord.Member = None) -> None:
        import random
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


async def setup(bot: commands.Bot) -> None:
    await bot.add_cog(AffiliateCog(bot))
