import asyncio
import logging
import discord

logger = logging.getLogger(__name__)


async def safe_api_call(coro, retries: int = 3):
    for attempt in range(retries):
        try:
            return await coro
        except discord.errors.HTTPException as e:
            if e.status == 429:
                wait = e.retry_after + 0.1
                logger.warning(f"Rate limited, retrying in {wait:.1f}s (attempt {attempt+1})")
                await asyncio.sleep(wait)
            else:
                logger.error(f"HTTP error in safe_api_call: {e}")
                raise
        except Exception as e:
            logger.error(f"Unexpected error in safe_api_call: {e}")
            raise
    raise RuntimeError("Max retries exceeded in safe_api_call")


async def get_or_create_user_channel(
    user: discord.Member,
    guild: discord.Guild,
    category_id: int,
    log_channel_id: int,
) -> discord.TextChannel | None:
    from discord_bot import database as db

    guild_id = str(guild.id)
    user_id  = str(user.id)

    channel_id = await db.get_channel(guild_id, user_id)
    if channel_id:
        channel = guild.get_channel(int(channel_id))
        if channel:
            perms = channel.permissions_for(user)
            if not (perms.read_messages and perms.send_messages):
                try:
                    await safe_api_call(
                        channel.set_permissions(
                            user,
                            read_messages=True, read_message_history=True,
                            send_messages=True, attach_files=True, send_voice_messages=True,
                        )
                    )
                except Exception as e:
                    logger.error(f"Failed to fix permissions for {user_id}: {e}")
            return channel

    try:
        category = guild.get_channel(category_id)
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
        channel = await safe_api_call(
            guild.create_text_channel(name, overwrites=overwrites, category=category)
        )
        await db.update_channel(guild_id, user_id, str(channel.id))

        log_channel = guild.get_channel(log_channel_id)
        if log_channel:
            await safe_api_call(log_channel.send(
                f"📢 New private channel for {user.name} ({user_id}): {channel.name}"
            ))
        return channel
    except Exception as e:
        logger.error(f"Failed to create channel for {user_id}: {e}")
        return None
