const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Unmute a user in the server')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to unmute')
        .setRequired(true)),

  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const muteRoleID = '1291107414740832368';

    if (user) {
      const member = interaction.guild.members.cache.get(user.id);
      if (member) {
        if (!member.roles.cache.has(muteRoleID)) {
          return await interaction.reply(`${user.tag} is not muted.`);
        }

        await member.roles.remove(muteRoleID);
        await interaction.reply(`${user.tag} has been unmuted.`);
      } else {
        await interaction.reply("That user isn't in the server.");
      }
    }
  },
};
