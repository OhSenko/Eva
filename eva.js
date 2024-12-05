const { Client, Guild, GatewayIntentBits, ActivityType, Collection, EmbedBuilder, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { token } = require('./config.json');
const config = require('./config.json');
const strings = require('./strings.json');
const path = require('path');
const fs = require('fs');

// YOOO THESE INTENTS ARE SUPER IMPORTANT
// Discord will literally throw hands if i forget any of these

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
  ],
});

client.commands = new Collection();

const commandFolders = fs.readdirSync(path.join(__dirname, 'commands'));

for (const folder of commandFolders) {
    const commandFiles = fs.readdirSync(path.join(__dirname, 'commands', folder))
        .filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
        const command = require(`./commands/${folder}/${file}`);
        
        if (command.data && command.data.name) {
            client.commands.set(command.data.name, command);
        } else {
            console.error(`Command in file ${folder}/${file} is missing 'data.name' property.`);
        }
    }
}

client.once('ready', async () => {
  const randomStatus = strings.statusMessages[Math.floor(Math.random() * strings.statusMessages.length)];

  client.user.setActivity(randomStatus, { type: ActivityType.Watching });

  const randomReadyMessage = strings.readyMessages[Math.floor(Math.random() * strings.readyMessages.length)];
  console.log(randomReadyMessage);

  await client.application.commands.set(client.commands.map(command => command.data));
});
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    try {
      const errorMessage = { 
        content: 'There was an error while executing this command!', 
        ephemeral: true 
      };
      
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    } catch (e) {
      console.error('Error while handling command error:', e);
    }
  }
});

const prefixes = ['?', '!'];

function makeEmbed(args) {
  const embed = new EmbedBuilder();
  if (args.title) embed.setTitle(args.title);
  if (args.description) embed.setDescription(args.description);
  if (args.author) embed.setAuthor(args.author);
  if (args.footer) embed.setFooter(args.footer);
  if (args.thumbnail) embed.setThumbnail(args.thumbnail);
  if (args.image) embed.setImage(args.image);
  if (args.timestamp) embed.setTimestamp(args.timestamp);

  const color = process.env.COLOUR || "#FF0000";
  embed.setColor(color);

  return embed;
}


// VERY IMPORTANT
// THIS IS THE MESSAGE HANDLER
// EVERYTHING BELOW THIS COMMENT IS MESSAGE HANDLING
// DO NOT TOUCH IT SENKO
// SHIT WILL BREAK
// I MEAN IT

client.on("messageCreate", async message => {
  if (message.author.bot) return;

  const content = message.content.toLowerCase();

  for (let keyword in strings.reactions) {
    if (content.includes(keyword)) {
      await message.reply(strings.reactions[keyword]);
      return;
    }
  }

  const hexColorRegex = /#([0-9A-Fa-f]{6})\b/g;
  const matches = message.content.match(hexColorRegex);

  if (matches) {
    for (const hex of matches) {
      const embed = new EmbedBuilder()
          .setTitle('Color Preview')
          .setDescription(`Here is ${hex}`)
          .setColor(hex)
          .setImage(`https://singlecolorimage.com/get/${hex.slice(1)}/100x100`);

      await message.channel.send({ embeds: [embed] });
    }
  }

  if (message.guild) {
    const matches = Array.from(message.content.matchAll(/discord\.com\/channels\/(\d{17,19})\/(\d{17,19})(?:\/(\d{17,19}))?(?:[^\d\/](?<!\>)|$)/g));
    if (!matches.length) return;

    const done = new Set();
    const embeds = [];
    let charCount = 0;

    function countEmbedChars(embed) {
      charCount += embed.data.author?.name?.length + embed.data.footer?.text?.length;
      if (embed.data.description) charCount += embed.data.description.length;
      if (embed.data.fields) for (const field of embed.data.fields) charCount += field.name.length + field.value.length;
      if (charCount > 6000) return true;
    }

    for (const match of matches) {
      const channel = await client.channels.fetch(match[2]);
      if (!channel) continue;

      if (!match[3] && (channel.type === 'PublicThread' || channel.type === 'PrivateThread')) {
        const parent = await client.channels.fetch(channel.parentId);

        if (parent.type === 'GuildForum') {
          const starter = await channel.fetchStarterMessage().catch(() => {});
          if (!starter) continue;

          const id = `${match[1]},${match[2]},${starter.id}`;
          if (done.has(id)) continue;

          if (!starter.member) {
            Object.defineProperty(starter, "member", {
              value: starter.author
            });
          }

          const embed = makeEmbed({
            author: {
              name: `Forum post by ${starter.member.displayName ?? "Unknown Member"}`,
              url: `https://discord.com/channels/${starter.guildId}/${starter.channelId}/${starter.id}`
            },
            footer: {
              text: `Quoted by ${message.member.username}`,
              iconURL: message.member.displayAvatarURL({ extension: 'png' })
            },
            thumbnail: starter.member.displayAvatarURL({ extension: 'png', size: 64 }),
            timestamp: starter.createdTimestamp,
            title: channel.name,
            description: starter.content
          });

          let image;
          if (starter.attachments.size !== 0) {
            const attachment = starter.attachments.first();
            if (attachment.contentType.startsWith("image/")) {
              embed.setImage(attachment.url);
              image = true;
            } else embed.addFields({
              name: "Attached file",
              value: `**[${attachment.name}](${attachment.url})**`
            });
          }

          if (!image) {
            const url = starter.content.match(/https?:\/\/\S*?\.(png|jpe?g|gif|webp)/i);
            if (url) {
              embed.setImage(url[0].replace(/\s/g, ""));
            }
          }

          if (countEmbedChars(embed)) break;

          embeds.push(embed);
          done.add(id);
          if (embeds.length > 9) break;
        }
        continue;
      }

      const id = `${match[1]},${match[2]},${match[3]}`;
      if (done.has(id)) continue;

      const quote = await channel.messages.fetch(match[3]).catch(() => {});
      if (!quote) continue;

      if (!quote.member) {
        Object.defineProperty(quote, "member", {
          value: quote.author
        });
      }

      const embed = makeEmbed({
        author: {
          name: `Message sent by ${quote.member?.displayName ?? "Unknown Member"}`,
          url: `https://discord.com/channels/${quote.guildId}/${quote.channelId}/${quote.id}`
        },
        footer: {
          text: `Quoted by ${message.member.displayName}`,
          iconURL: message.member.displayAvatarURL({ extension: 'png' })
        },
        thumbnail: quote.member.displayAvatarURL({ extension: 'png', size: 64 }),
        timestamp: quote.createdTimestamp,
        description: quote.content
      });

      let image;
      if (quote.attachments?.size) {
        const attachment = quote.attachments.first();
        if (attachment.contentType?.startsWith("image/")) {
          embed.setImage(attachment.url);
          image = true;
        } else embed.addFields({
          name: "Attached file",
          value: `**[${attachment.name}](${attachment.url})**`
        });
      }

      if (!image && quote.content) {
        const url = quote.content.match(/https?:\/\/\S*?\.(png|jpe?g|gif|webp)/i);
        if (url) {
          embed.setImage(url[0].replace(/\s/g, ""));
        }
      }

      if (quote.stickers?.size) {
        embed.addFields({
          name: `${quote.stickers.size} Sticker${quote.stickers.size ? "" : "s"}`,
          value: quote.stickers.map(e => e.name).join(", ")
        });
      }

      if (countEmbedChars(embed)) break;

      embeds.push(embed);
      done.add(id);
      if (embeds.length > 9) break;
    }

    if (embeds.length) {
      const row = new ActionRowBuilder();
      const jump = new ButtonBuilder()
        .setLabel("Jump")
        .setURL(embeds[0].data.author.url)
        .setStyle(ButtonStyle.Link);

      const remove = new ButtonBuilder()
        .setEmoji('✖')
        .setCustomId(`delete_${message.author.id}`)
        .setStyle(ButtonStyle.Danger);

      row.addComponents([jump, remove]);

      message.reply({
        allowedMentions: {},
        embeds,
        components: [row]
      }).catch(() => {});
    }
  }
});

client.on("interactionCreate", interaction => {
  if (interaction.isButton() && interaction.customId) {
    if (interaction.customId.startsWith("delete_")) {
      if (interaction.user.id === interaction.customId.slice(7) || ["ManageMessages", "ModerateMembers", "KickMembers", "BanMembers"].some(permission => interaction.member.permissions.has(PermissionsBitField.Flags[permission]))) {
        interaction.message.delete().catch(() => {});
        interaction.reply({ content: "Message deleted", ephemeral: true });
      } else {
        interaction.reply({ content: "You can't delete this message", ephemeral: true });
      }
    }
  }
});

client.deletedMessages = new Map();

client.on('messageDelete', (message) => {
  if (message.partial) return;

  client.deletedMessages.set(message.channel.id, {
    content: message.content,
    author: message.author,
    timestamp: message.createdTimestamp,
  });
});


client.on('messageDelete', async (message) => {
  if (message.partial || message.author.bot) return;

  const logChannel = await client.channels.fetch(config.logChannelId);
  if (!logChannel) return;

  const embed = new EmbedBuilder()
    .setColor('#FF0000')
    .setTitle('Message Deleted')
    .setDescription(message.content || '*No content*')
    .addFields(
      { name: 'Author', value: message.author.tag, inline: true },
      { name: 'Channel', value: message.channel.name, inline: true },
      { name: 'Time', value: `<t:${Math.floor(message.createdTimestamp / 1000)}:R>`, inline: true }
    )
    .setFooter({ text: `Message ID: ${message.id}`, iconURL: message.author.displayAvatarURL() })
    .setTimestamp();

  logChannel.send({ embeds: [embed] });
});

client.on('messageUpdate', async (oldMessage, newMessage) => {
  if (oldMessage.author.bot || oldMessage.content === newMessage.content) return;

  const logChannel = await client.channels.fetch(config.logChannelId);
  if (!logChannel) return;

  const embed = new EmbedBuilder()
    .setColor('#FFA500')
    .setTitle('Message Edited')
    .setDescription(`**Before:** ${oldMessage.content}\n**After:** ${newMessage.content}`)
    .addFields(
      { name: 'Author', value: oldMessage.author.tag, inline: true },
      { name: 'Channel', value: oldMessage.channel.name, inline: true },
      { name: 'Time', value: `<t:${Math.floor(oldMessage.createdTimestamp / 1000)}:R>`, inline: true }
    )
    .setFooter({ text: `Message ID: ${oldMessage.id}`, iconURL: oldMessage.author.displayAvatarURL() })
    .setTimestamp();

  logChannel.send({ embeds: [embed] });
});

client.on('guildMemberUpdate', async (oldMember, newMember) => {
  if (oldMember.isCommunicationDisabled() && !newMember.isCommunicationDisabled()) {
    const channel = newMember.guild.channels.cache.get(config.logChannelId);
    if (channel) {
      const unmuteMessage = strings.unmuteMessage.replace('{user}', newMember.user.tag);
      channel.send(unmuteMessage);
    }
  }
});

client.login(token);

client.on('interactionCreate', async interaction => {
    console.log('Interaction received:', interaction.customId);
    
    const interactionHandler = require('./events/interactionCreate.js');
    await interactionHandler.execute(interaction).catch(error => {
        console.error('Error handling interaction:', error);
    });
});

