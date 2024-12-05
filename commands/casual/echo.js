const { SlashCommandBuilder } = require('discord.js');

// i wish it wouldnt snitch on me using the command but it does
// i dont care
module.exports = {
  data: new SlashCommandBuilder()
    .setName('echo')
    .setDescription('Echoes the user input.')
    .addStringOption(option => 
      option.setName('message')
        .setDescription('The message to echo')
        .setRequired(true)),

  async execute(interaction) {
    const message = interaction.options.getString('message');
    await interaction.reply(message);
  },
};
