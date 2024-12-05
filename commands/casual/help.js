const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Shows a list of available commands'),

    async execute(interaction) {
        const commands = [...interaction.client.commands.values()];
        const commandsPerPage = 10;
        const totalPages = Math.ceil(commands.length / commandsPerPage);
        let currentPage = 0;

        const generateEmbed = (page) => {
            const startIndex = page * commandsPerPage;
            const currentCommands = commands.slice(startIndex, startIndex + commandsPerPage);

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('Command List')
                .setDescription('Here are all available commands:')
                .setFooter({ text: `Page ${page + 1}/${totalPages}` });

            currentCommands.forEach(cmd => {
                embed.addFields({
                    name: `/${cmd.data.name}`,
                    value: cmd.data.description || 'No description available'
                });
            });

            return embed;
        };

        const getButtons = () => {
            const row = new ActionRowBuilder();

            row.addComponents(
                new ButtonBuilder()
                    .setCustomId('prev_page')
                    .setLabel('◀')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentPage === 0),
                new ButtonBuilder()
                    .setCustomId('delete')
                    .setLabel('❌')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('next_page')
                    .setLabel('▶')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentPage === totalPages - 1)
            );

            return row;
        };

        const response = await interaction.reply({
            embeds: [generateEmbed(currentPage)],
            components: commands.length > commandsPerPage ? [getButtons()] : [],
            fetchReply: true
        });

        if (commands.length > commandsPerPage) {
            const collector = response.createMessageComponentCollector({
                time: 60000
            });

            collector.on('collect', async (i) => {
                if (i.user.id !== interaction.user.id) {
                    return i.reply({ content: 'You cannot use these buttons.', ephemeral: true });
                }

                switch (i.customId) {
                    case 'prev_page':
                        currentPage--;
                        break;
                    case 'next_page':
                        currentPage++;
                        break;
                    case 'delete':
                        return await response.delete();
                }

                await i.update({
                    embeds: [generateEmbed(currentPage)],
                    components: [getButtons()]
                });
            });

            collector.on('end', () => {
                if (!response.deleted) {
                    response.edit({ components: [] }).catch(() => {});
                }
            });
        }
    }
}; 