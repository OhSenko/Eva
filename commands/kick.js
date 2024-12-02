const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a user from the server')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to kick')
        .setRequired(true)),

  async execute(interaction) {
    const user = interaction.options.getUser('user');
    if (user) {
      const member = interaction.guild.members.cache.get(user.id);
      if (member) {
        await member.kick();
        await interaction.reply(`${user.tag} has been kicked.`);
      } else {
        await interaction.reply("That user isn't in the server.");
      }
    }
  },
};
