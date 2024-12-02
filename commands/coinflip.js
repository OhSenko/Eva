const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Gambling addiction :3'),

  async execute(interaction) {
    const flip = Math.random() < 0.5 ? 'heads' : 'tails';
    await interaction.reply(`The coin landed on: ${flip}`);
  },
};
