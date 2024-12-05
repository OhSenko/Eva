const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const AuditLogger = require('../../utils/auditLogger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a user from the server')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to kick')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the kick')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    if (!interaction.member.permissions.has('KickMembers')) {
      return interaction.reply({ 
        content: 'You do not have permission to kick members.', 
        ephemeral: true 
      });
    }

    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    await interaction.guild.members.kick(user, reason);

    const kickEmbed = new EmbedBuilder()
      .setColor(0xFFA500)  // Orange color for kick
      .setTitle('👢 User Kicked')
      .addFields(
        { name: 'User', value: `${user.tag} (<@${user.id}>)`, inline: true },
        { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true },
        { name: 'Reason', value: reason }
      )
      .setThumbnail(user.displayAvatarURL())
      .setTimestamp();

    await interaction.reply({ embeds: [kickEmbed] });

    await AuditLogger.logModAction(
      interaction,
      'Kick',
      user,
      reason
    );
  },
};
