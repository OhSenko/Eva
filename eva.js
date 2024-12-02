const { Client, Guild, GatewayIntentBits, ActivityType, Collection, EmbedBuilder } = require('discord.js');
const { token } = require('./config.json');
const path = require('path');
const fs = require('fs');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

client.commands = new Collection();

const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  
  if (command.data && command.data.name) {
    client.commands.set(command.data.name, command);
  } else {
    console.error(`Command in file ${file} is missing 'data.name' property.`);
  }
}

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);
  
    client.user.setActivity('naughty stuff~', { type: ActivityType.Watching});
  
    await client.application.commands.set(client.commands.map(command => command.data));
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (command) {
    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
  }
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const content = message.content.toLowerCase();

  if (content.includes('tweaking')) {
    await message.reply('https://tenor.com/view/xqc-twitch-osu-gif-25667324');
  } else if (content.includes('senko')) {
    await message.reply('https://cdn.discordapp.com/attachments/1291678159988723794/1312498303522439278/caption.gif?ex=674eb10c&is=674d5f8c&hm=f43302870d424b192a96ea5702d296314694b877d32db4ce9fa9805596c20981&');
  } else if (content.includes('thanks eva')) {
    await message.reply('No problem, KING!');
  } else if (content.includes('my flow')) {
    await message.reply('https://cdn.discordapp.com/attachments/717498714259980378/1307167030205616229/caption-5-1.gif?ex=674e69a9&is=674d1829&hm=3c88b14e7043d0a5184c9076e51d96bb49b786da9e745600faabeeca3255a92a&');
  } else if (content.includes('haii')) {
    await message.reply('https://media.discordapp.net/attachments/1313140792935845888/1313140896803586049/cat-silly-hello.gif?ex=674f0d42&is=674dbbc2&hm=bafeba951e0c8ca56b0af0488c0a42cd61aec8d51f9f51bab7c4a341db0bf43d&=');
  }

  const urlRegex = /https:\/\/discord\.com\/channels\/\d+\/\d+\/(\d+)/;
  const match = message.content.match(urlRegex);

  if (match) {
    const messageId = match[1];
    const channelId = match[0].split("/")[5];

    try {
      const channel = await message.guild.channels.fetch(channelId);
      if (!channel) {
        return message.reply('I could not find the channel for the message');
      }

      const originalMessage = await channel.messages.fetch(messageId);

      console.log('Original Message:', originalMessage);
      console.log('Attachments:', originalMessage.attachments);

      const messageContent = originalMessage.content || " ";

      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setAuthor({
          name: originalMessage.author.username,
          iconURL: originalMessage.author.displayAvatarURL(),
        })
        .setDescription(messageContent)
        .setTimestamp(originalMessage.createdAt)
        .setFooter({
          text: `Quoted by ${message.author.username}`,
          iconURL: message.author.displayAvatarURL(),
        });

      if (originalMessage.attachments.size > 0) {
        const attachment = originalMessage.attachments.first();
        console.log('First Attachment URL:', attachment.url);
        embed.setImage(attachment.url);
      }

      await message.reply({
        embeds: [embed],
      });
    } catch (error) {
      console.error('Error fetching message:', error);
      await message.reply('Something went wrong :3');
    }
  }
});

client.login(token);