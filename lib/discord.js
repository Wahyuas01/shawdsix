// Server-only. Jangan pernah import file ini dari client component.
// Butuh bot Discord yang sudah di-invite ke server komunitas, dengan
// intent "Server Members Intent" aktif (di Discord Developer Portal >
// Bot > Privileged Gateway Intents).

const DISCORD_API = 'https://discord.com/api/v10';

export async function getGuildMemberRoles(discordUserId) {
  const guildId = process.env.DISCORD_GUILD_ID;
  const botToken = process.env.DISCORD_BOT_TOKEN;

  const res = await fetch(`${DISCORD_API}/guilds/${guildId}/members/${discordUserId}`, {
    headers: { Authorization: `Bot ${botToken}` },
    cache: 'no-store',
  });

  if (!res.ok) {
    if (res.status === 404) return []; // user belum join server / belum member
    throw new Error(`Discord API error: ${res.status}`);
  }

  const member = await res.json();
  return member.roles || []; // array of discord role IDs
}
