const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

// i dont care if this is a bad command

module.exports = {
  data: new SlashCommandBuilder()
    .setName('snipe')
    .setDescription('Retrieves the last deleted message in the channel.'),

  async execute(interaction) {
    const channel = interaction.channel;
    const deletedMessage = channel.client.deletedMessages.get(channel.id);

    if (!deletedMessage) {
      return interaction.reply({ content: 'No message has been deleted in this channel recently.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('Get sniped idiot :3')
      .setDescription(deletedMessage.content || '*No content available*')
      .addFields(
        { name: 'Author', value: deletedMessage.author.username, inline: true },
        { name: 'Time', value: `<t:${Math.floor(deletedMessage.timestamp / 1000)}:R>`, inline: true }
      )
      .setFooter({ text: `Deleted by ${deletedMessage.author.username}`, iconURL: deletedMessage.author.displayAvatarURL() })
      .setTimestamp(deletedMessage.timestamp);

    return interaction.reply({ embeds: [embed] });
  },
};
