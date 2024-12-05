const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban a user from the server')
    .addStringOption(option =>
      option.setName('user_id')
        .setDescription('The ID of the user to unban')
        .setRequired(true)),

  async execute(interaction) {
    const userId = interaction.options.getString('user_id');
    
    try {
      const bannedUsers = await interaction.guild.bans.fetch();

      const bannedUser = bannedUsers.get(userId);
      if (!bannedUser) {
        return await interaction.reply("That user is not banned.");
      }

      await interaction.guild.members.unban(userId);
      await interaction.reply(`${bannedUser.user.tag} has been unbanned.`);
    } catch (error) {
      console.error(error);
      await interaction.reply("An error occurred while trying to unban the user.");
    }
  },
};
