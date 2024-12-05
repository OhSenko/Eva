const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('checkup')
    .setDescription('Check if Eva is still alive'),

  async execute(interaction) {
    await interaction.reply('I am still alive darling~');
  },
};
