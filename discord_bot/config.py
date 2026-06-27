import os
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv('BOT_TOKEN')
if not BOT_TOKEN:
    raise ValueError("BOT_TOKEN environment variable is not set")

GUILD_ID           = int(os.getenv('GUILD_ID',           '1348248729878134885'))
CHALLENGE_CHANNEL_ID = int(os.getenv('CHALLENGE_CHANNEL_ID', '1388256520541700176'))
LOG_CHANNEL_ID     = int(os.getenv('LOG_CHANNEL_ID',     '1388138273834012682'))
CATEGORY_ID        = int(os.getenv('CATEGORY_ID',        '1428941254544064522'))
ADMIN_ROLE_ID      = int(os.getenv('ADMIN_ROLE_ID',      '1376921339994181734'))
FULL_ACCESS_ROLE_ID = int(os.getenv('FULL_ACCESS_ROLE_ID', '1401364349905276990'))
AFFILIATER_ROLE_ID = int(os.getenv('AFFILIATER_ROLE_ID', '1404007129593020520'))

PREMIUM_ROLE_PRICES: dict[int, float] = {
    1404040571018023024: 8.0,   # premium
    1387177079270805645: 35.0,  # elite
}

DB_FILE          = os.getenv('DB_FILE', 'bot_data.db')
COOLDOWN_SECONDS = int(os.getenv('COOLDOWN_SECONDS', '5'))
LOG_FILE         = os.getenv('LOG_FILE', 'bot.log')
