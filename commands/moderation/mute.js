const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const AuditLogger = require('../../utils/auditLogger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Timeout a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to timeout')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('Timeout duration (e.g., 1h, 1d, 1w)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the timeout')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        if (!interaction.member.permissions.has('ModerateMembers')) {
            return interaction.reply({ 
                content: 'You do not have permission to timeout members.', 
                ephemeral: true 
            });
        }

        const user = interaction.options.getUser('user');
        const duration = interaction.options.getString('duration');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        
        const durationMs = parseDuration(duration);
        
        if (!durationMs) {
            return interaction.reply({ 
                content: 'Invalid duration format. Use format: number + s/m/h/d/w/mo/y (e.g., 1h, 1d, 1w)',
                ephemeral: true 
            });
        }

        const member = await interaction.guild.members.fetch(user.id);
        await member.timeout(durationMs, reason);

        const muteEmbed = new EmbedBuilder()
            .setColor(0xFFFF00)  // Yellow color for timeout
            .setTitle('🔇 User Timed Out')
            .addFields(
                { name: 'User', value: `${user.tag} (<@${user.id}>)`, inline: true },
                { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true },
                { name: 'Duration', value: duration, inline: true },
                { name: 'Reason', value: reason }
            )
            .setThumbnail(user.displayAvatarURL())
            .setTimestamp();

        await interaction.reply({ embeds: [muteEmbed] });

        // Log the moderation action
        await AuditLogger.logModAction(
            interaction,
            'Timeout',
            user,
            reason,
            duration
        );
    }
};

function parseDuration(duration) {
    const regex = /^(\d+)([shd])$/;
    const match = duration.match(regex);
    
    if (!match) return null;
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    const ms = unit === 's'
        ? value * 1000  // seconds to ms
        : unit === 'h'
        ? value * 60 * 60 * 1000  // hours to ms
        : value * 24 * 60 * 60 * 1000;  // days to ms
        
    // Discord maximum timeout is 28 days
    return Math.min(ms, 28 * 24 * 60 * 60 * 1000);
}
