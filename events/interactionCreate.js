const { ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const config = require('../config.json');
const AuditLogger = require('../utils/auditLogger');

// same as buttonInteraction.js
// i dont know what this does
module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (!interaction.isButton()) return;

        // Handle modping confirmation
        if (interaction.customId === 'modping_confirm') {
            console.log('Modping confirm button clicked');
            
            // Check if user has required roles
            const hasModRole = interaction.member.roles.cache.has(config.moderatorRole);
            const hasAdminRole = interaction.member.roles.cache.has(config.adminRole);
            
            console.log(`Role check - Mod: ${hasModRole}, Admin: ${hasAdminRole}`);
            
            if (!hasModRole && !hasAdminRole) {
                console.log('User lacks required roles');
                try {
                    await interaction.reply({ 
                        content: 'Only moderators and administrators can confirm this ping.', 
                        ephemeral: true 
                    });
                } catch (error) {
                    console.error('Error replying to unauthorized user:', error);
                }
                return;
            }

            try {
                console.log('Attempting to clear timeout');
                // Clear the timeout first
                if (global.modPingTimeouts?.has(interaction.message.id)) {
                    clearTimeout(global.modPingTimeouts.get(interaction.message.id));
                    global.modPingTimeouts.delete(interaction.message.id);
                    console.log('Timeout cleared');
                }

                console.log('Current message content:', interaction.message.content);
                // Get the original message content and add [Resolved]
                let newContent = interaction.message.content;
                if (!newContent.includes('[Resolved]')) {
                    newContent = `${newContent} [Resolved]`;
                }
                console.log('New content will be:', newContent);

                // Update the message with [Resolved] and remove the button
                console.log('Attempting to update message');
                await interaction.update({
                    content: newContent,
                    components: [] // Remove all buttons
                });
                console.log('Message updated successfully');

            } catch (error) {
                console.error('Error in modping confirmation:', error);
                console.error('Full error:', error.stack);
                try {
                    await interaction.reply({ 
                        content: 'There was an error processing your confirmation.', 
                        ephemeral: true 
                    });
                } catch (replyError) {
                    console.error('Error sending error message:', replyError);
                }
            }
        }

        // Handle ban buttons
        if (interaction.customId.startsWith('ban_')) {
            const actionData = global.pendingActions.get(`ban_${interaction.message.interaction.id}`);
            if (!actionData) {
                await interaction.reply({ content: 'This action has expired.', ephemeral: true });
                return;
            }

            const { userId, moderatorId, reason, guildId, guildName } = actionData;
            const user = await interaction.client.users.fetch(userId);

            switch (interaction.customId) {
                case 'ban_confirm':
                    await interaction.guild.members.ban(userId, { reason });
                    await interaction.update({ 
                        content: `Successfully banned ${user.tag}`, 
                        embeds: [], 
                        components: [] 
                    });
                    await AuditLogger.logModAction(interaction, 'Ban', user, reason);
                    break;

                case 'ban_decline':
                    await interaction.update({ 
                        content: 'Ban cancelled', 
                        embeds: [], 
                        components: [] 
                    });
                    break;

                case 'ban_compromised':
                    try {
                        await interaction.guild.members.ban(userId, { 
                            deleteMessageSeconds: 86400,
                            reason: 'Compromised Account' 
                        });
                        await interaction.guild.members.unban(userId);
                        await AuditLogger.logModAction(interaction, 'Compromised Account', user, 'Account appeared to be compromised');

                        try {
                            await user.send(
                                `You were kicked from ${guildName} because your account seemed to be compromised. ` +
                                `You can join back once you have reset your password and secured your account. ` +
                                `Alternatively, you can contact <@${moderatorId}> to get back into the server.`
                            );
                        } catch (dmError) {
                            console.error('Could not DM user:', dmError);
                        }

                        await interaction.update({ 
                            content: `Handled compromised account for ${user.tag}`, 
                            embeds: [], 
                            components: [] 
                        });
                    } catch (error) {
                        console.error('Error handling compromised account:', error);
                        await interaction.reply({ 
                            content: 'There was an error handling the compromised account.', 
                            ephemeral: true 
                        });
                    }
                    break;
            }

            global.pendingActions.delete(`ban_${interaction.message.interaction.id}`);
        }

        // Handle kick buttons
        if (interaction.customId.startsWith('kick_')) {
            const actionData = global.pendingActions.get(`kick_${interaction.message.interaction.id}`);
            if (!actionData) {
                await interaction.reply({ content: 'This action has expired.', ephemeral: true });
                return;
            }

            const { userId, reason } = actionData;
            const user = await interaction.client.users.fetch(userId);

            switch (interaction.customId) {
                case 'kick_confirm':
                    await interaction.guild.members.kick(userId, reason);
                    await interaction.update({ 
                        content: `Successfully kicked ${user.tag}`, 
                        embeds: [], 
                        components: [] 
                    });
                    await AuditLogger.logModAction(interaction, 'Kick', user, reason);
                    break;

                case 'kick_decline':
                    await interaction.update({ 
                        content: 'Kick cancelled', 
                        embeds: [], 
                        components: [] 
                    });
                    break;
            }

            global.pendingActions.delete(`kick_${interaction.message.interaction.id}`);
        }

        // Handle mute buttons
        if (interaction.customId.startsWith('mute_')) {
            const actionData = global.pendingActions.get(`mute_${interaction.message.interaction.id}`);
            if (!actionData) {
                await interaction.reply({ content: 'This action has expired.', ephemeral: true });
                return;
            }

            const { userId, duration, reason } = actionData;
            const user = await interaction.client.users.fetch(userId);
            
            switch (interaction.customId) {
                case 'mute_confirm':
                    try {
                        const member = await interaction.guild.members.fetch(userId);
                        await member.timeout(duration, reason);
                        
                        // Calculate when the timeout will end
                        const endTime = new Date(Date.now() + duration);
                        
                        await interaction.update({ 
                            content: `Successfully timed out ${user.tag} until ${endTime.toLocaleString()}`, 
                            embeds: [], 
                            components: [] 
                        });
                        
                        await AuditLogger.logModAction(interaction, 'Timeout', user, `${reason} (Until: ${endTime.toLocaleString()})`);

                        // Set timeout to remove the timeout
                        setTimeout(async () => {
                            try {
                                const member = await interaction.guild.members.fetch(userId);
                                if (member.isCommunicationDisabled()) {
                                    await member.timeout(null);
                                    console.log(`Removed timeout from ${user.tag}`);
                                }
                            } catch (error) {
                                console.error(`Error removing timeout from ${user.tag}:`, error);
                            }
                        }, duration);
                    } catch (error) {
                        console.error('Error applying timeout:', error);
                        await interaction.reply({ 
                            content: 'There was an error applying the timeout.', 
                            ephemeral: true 
                        });
                    }
                    break;

                case 'mute_decline':
                    await interaction.update({ 
                        content: 'Timeout cancelled', 
                        embeds: [], 
                        components: [] 
                    });
                    break;
            }

            global.pendingActions.delete(`mute_${interaction.message.interaction.id}`);
        }
    }
}; 