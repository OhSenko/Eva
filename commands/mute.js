const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Mute a user in the server for a specified duration')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to mute')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('duration')
        .setDescription('The duration for the mute (e.g., 10m, 2h, 1d)')
        .setRequired(false)),

  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const duration = interaction.options.getString('duration');
    const muteRoleID = '1291107414740832368';

    if (user) {
      const member = interaction.guild.members.cache.get(user.id);
      if (member) {
        if (member.roles.cache.has(muteRoleID)) {
          return await interaction.reply(`<@!${user.id}> is already muted.`);
        }

        await member.roles.add(muteRoleID);
        await interaction.reply(`<@!${user.id}> was silenced by judgement of the goddess.`);

        if (duration) {
          const msDuration = parseDuration(duration);
          if (msDuration) {
            setTimeout(async () => {
              await member.roles.remove(muteRoleID);
              await interaction.followUp(`<@!${user.id}> has been freed by the grace of the goddess.`);
            }, msDuration);
          } else {
            await interaction.followUp("Invalid duration format. Please use one of the following: s, m, h, d, w, mo, y.");
          }
        }
      } else {
        await interaction.reply("Who the fuck are you talking about?");
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
