const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/modlogs.json');

if (!fs.existsSync(path.join(__dirname, '../data'))) {
    fs.mkdirSync(path.join(__dirname, '../data'));
}

let data = { caseNumber: 0, logs: {} };
try {
    if (fs.existsSync(DATA_PATH)) {
        data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
    } else {
        fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
    }
} catch (error) {
    console.error('Error loading moderation logs:', error);
}

class AuditLogger {
    static async logModAction(interaction, action, target, reason, duration = null) {
        const config = require('../config.json');
        data.caseNumber++;

        const auditChannel = await interaction.client.channels.fetch(config.auditLogChannelId);
        if (!auditChannel) return;

        const logEntry = {
            caseId: data.caseNumber,
            moderator: {
                id: interaction.user.id,
                tag: interaction.user.tag
            },
            action: action,
            target: {
                id: target.id,
                tag: target.tag
            },
            reason: reason,
            duration: duration,
            timestamp: Date.now()
        };

        // Store the log entry
        if (!data.logs[interaction.user.id]) {
            data.logs[interaction.user.id] = [];
        }
        data.logs[interaction.user.id].push(logEntry);

        // Save to file
        try {
            fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('Error saving moderation logs:', error);
        }

        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setAuthor({
                name: `Moderation Records | Case ${data.caseNumber}`,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true })
            })
            .addFields(
                { name: 'Moderator', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                { name: 'Action', value: action, inline: true },
                { name: 'Target', value: `${target.tag} (${target.id})`, inline: true },
                { name: 'When', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
            )
            .setTimestamp();

        if (duration) {
            embed.addFields({ name: 'Duration', value: duration, inline: true });
        }

        if (reason) {
            embed.addFields({ name: 'Reason', value: reason, inline: false });
        }

        return await auditChannel.send({ embeds: [embed] });
    }

    static getModerationLogs(moderatorId) {
        return data.logs[moderatorId] || [];
    }

    static getCurrentCaseNumber() {
        return data.caseNumber;
    }
}

module.exports = AuditLogger; 