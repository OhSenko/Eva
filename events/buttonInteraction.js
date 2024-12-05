// i stole this from the internet
// i dont know how it works
// but it works

// i also dont know what this does

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (!interaction.isButton()) return;

        // Handle modping confirm button
        if (interaction.customId === 'modping_confirm') {
            try {
                const message = interaction.message;
                
                // Clear any pending timeouts for this message
                if (global.modPingTimeouts.has(message.id)) {
                    clearTimeout(global.modPingTimeouts.get(message.id));
                    global.modPingTimeouts.delete(message.id);
                }

                // Disable the button
                const row = message.components[0];
                row.components[0].setDisabled(true);
                
                // Update the embed
                const embed = EmbedBuilder.from(message.embeds[0])
                    .setColor('#00FF00')
                    .setTitle('✅ Moderator Responding')
                    .addFields(
                        { name: 'Responding Moderator', value: `<@${interaction.user.id}>` }
                    );

                await interaction.update({
                    embeds: [embed],
                    components: [row]
                });

            } catch (error) {
                console.error('Error handling modping confirm button:', error);
                await interaction.reply({
                    content: 'There was an error while processing the button interaction.',
                    ephemeral: true
                });
            }
        }
    },
}; 