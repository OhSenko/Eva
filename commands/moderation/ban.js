const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const AuditLogger = require('../../utils/auditLogger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user from the server')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to ban')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the ban')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    if (!interaction.member.permissions.has('BanMembers')) {
        return interaction.reply({ 
            content: 'You do not have permission to ban members.', 
            ephemeral: true 
        });
    }

    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    await interaction.guild.members.ban(user, { reason });

    const banEmbed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle('🔨 User Banned')
      .addFields(
        { name: 'User', value: `${user.tag} (<@${user.id}>)`, inline: true },
        { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true },
        { name: 'Reason', value: reason }
      )
      .setThumbnail(user.displayAvatarURL())
      .setTimestamp();

    await interaction.reply({ embeds: [banEmbed] });

    await AuditLogger.logModAction(
      interaction,
      'Ban',
      user,
      reason
    );
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
