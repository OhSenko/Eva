const { SlashCommandBuilder } = require('discord.js');
const strings = require('../strings.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user from the server for a specified duration')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to ban')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('duration')
        .setDescription('The duration for the ban (e.g., 10m, 2h, 1d)')
        .setRequired(false)),

  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const duration = interaction.options.getString('duration');
    const banReason = 'Banned by a command';

    if (user) {
      const member = interaction.guild.members.cache.get(user.id);
      if (member) {
        await member.ban({ reason: banReason });

        const banMessage = strings.banMessages[Math.floor(Math.random() * strings.banMessages.length)];
        
        await interaction.reply(`<@!${user.id}> ${banMessage} <a:kys:1313101042707075134>`);

        if (duration) {
          const msDuration = parseDuration(duration);
          if (msDuration) {
            setTimeout(async () => {
              await interaction.guild.members.unban(user.id);

              const unbanMessage = strings.unbanMessages[Math.floor(Math.random() * strings.unbanMessages.length)];

              await interaction.followUp(`<@!${user.id}> ${unbanMessage}`);
            }, msDuration);
          } else {
            await interaction.followUp("Invalid duration format. Please use one of the following: s, m, h, d, w, mo, y.");
          }
        }
      } else {
        await interaction.reply("That user isn't in the server.");
      }
    }
  },
};

function parseDuration(duration) {
  const regex = /^(\d+)(s|m|h|d|w|mo|y)$/;
  const match = duration.match(regex);

  if (!match) return null;

  const amount = parseInt(match[1], 10);
  const unit = match[2];

  let ms = 0;

  switch (unit) {
    case 's': ms = amount * 1000; break;
    case 'm': ms = amount * 60 * 1000; break;
    case 'h': ms = amount * 60 * 60 * 1000; break;
    case 'd': ms = amount * 24 * 60 * 60 * 1000; break;
    case 'w': ms = amount * 7 * 24 * 60 * 60 * 1000; break;
    case 'mo': ms = amount * 30 * 24 * 60 * 60 * 1000; break;
    case 'y': ms = amount * 365 * 24 * 60 * 60 * 1000; break;
    default: return null;
  }

  return ms;
}
