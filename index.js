const { Client, Collection, GatewayIntentBits, ChannelType, PermissionsBitField , WebhookClient,AuditLogEvent,EmbedBuilder} = require('discord.js');
const fs = require('fs');
const webhooks = require('./webhooks.json');
const webhookClient1 = new WebhookClient({ id: webhooks.webhook1.id, token: webhooks.webhook1.token });
const webhookClient2 = new WebhookClient({ id: webhooks.webhook2.id, token: webhooks.webhook2.token });
const webhookClient3 = new WebhookClient({ id: webhooks.webhook3.id, token: webhooks.webhook3.token });
const webhookClient4 = new WebhookClient({ id: webhooks.webhook4.id, token: webhooks.webhook4.token });
const webhookClient5 = new WebhookClient({ id: webhooks.webhook5.id, token: webhooks.webhook5.token });
const webhookClient6 = new WebhookClient({ id: webhooks.webhook6.id, token: webhooks.webhook6.token });
const webhookClient7 = new WebhookClient({ id: webhooks.webhook7.id, token: webhooks.webhook7.token });
const webhookClient8 = new WebhookClient({ id: webhooks.webhook8.id, token: webhooks.webhook8.token });
const webhookClient9 = new WebhookClient({ id: webhooks.webhook9.id, token: webhooks.webhook9.token });
const client = new Client({ intents: [ 
  GatewayIntentBits.DirectMessages,
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.MessageContent,
  GatewayIntentBits.GuildVoiceStates
] });
const disconnectCounts = new Map();
const executorsCounts = new Map();
  const config = require('./config.json');
  client.on('ready', async () => {
    console.log('Ready!');
  
    client.on('messageCreate', async (message) => {
      // Ignore messages from bots
      if (message.author.bot) return;
  
      // Check if the message content is "setup"
      if (message.content.toLowerCase() === 'setup') {
        const guild = message.guild;
  
        // Create category
        const category = await guild.channels.create({
          name: 'Logs',
          type: ChannelType.GuildCategory,
          permissionOverwrites: [
            {
              id: guild.id,
              deny: [PermissionsBitField.Flags.ViewChannel],
            },
          ],
        });
  
        // Create channels
        const channelNames = ['disconnect-logs','left','move-logs','switch','join','mute-logs','unmute','deafen-logs','undeafen'];
  
        const webhooks = {};
  
        for (let i = 0; i < channelNames.length; i++) {
          const channel = await guild.channels.create({
            name: channelNames[i],
            type: ChannelType.GuildText,
            parent: category,
          });
  
          // Create webhook for each channel
          const webhook = await channel.createWebhook({ name: `Webhook ${i + 1}` });
          webhooks[`webhook${i + 1}`] = {
            id: webhook.id,
            token: webhook.token,
          };
        }
  
        // Save webhooks to config.json
        fs.writeFile('webhooks.json', JSON.stringify(webhooks, null, 2), (err) => {
          if (err) {
            console.error('Error saving webhooks:', err);
            return message.channel.send('Error saving webhooks.');
          }
  
          message.channel.send('Setup complete.');
        });
      }
    });
client.on("voiceStateUpdate", async (oldState, newState) => {
  // disconnect
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  const guild = oldState.guild;
    if (oldState.channel && !newState.channel) {
      const newChannel = newState.channel;
      const oldChannel = oldState.channel;

      const auditLogs = await guild.fetchAuditLogs({
        type: AuditLogEvent.MemberDisconnect,
        limit: 100,
      });
      const logEntry = auditLogs.entries?.find(
        (entry) =>
          Number(entry.extra.count) !==
            Number(
              disconnectCounts.get(`${entry.executor.id}_${guild.id}`)
                ? disconnectCounts.get(`${entry?.executor.id}_${guild.id}`)
                : 0
            ) && entry.createdAt.getTime() >= fiveMinutesAgo
      );
      if (logEntry && logEntry.executorId !== oldState.member.user.id) {
        const executorAndChannel = `${logEntry?.executor.id}_${guild.id}`;
        if (!disconnectCounts.has(executorAndChannel)) {
          disconnectCounts.set(executorAndChannel, 0);
        }        
        const embed1 = new EmbedBuilder()
          .setAuthor({ name: newState.member.user.username, iconURL: newState.member.user.displayAvatarURL()})
          .setDescription(`**<@${newState.member.user.id}> Is Disconnected From \`${oldChannel.name}\`** `)
          .addFields({ name: '<:discord_ban:1208612199023640597>  Responsable Moderator : ', value: `<@${logEntry.executor.id}>`})
          .setTimestamp()
          .setFooter({ text: `${logEntry.executor.username}`, iconURL: logEntry.executor.displayAvatarURL()});
        
        webhookClient1.send({
          embeds: [embed1],
        });
        // await disconnect(
        //   logsChannel,
        //   oldChannel,
        //   newState.member.user,
        //   logEntry.executor,
        //   logsClass.data.disconnect.hexColor
        // );

        disconnectCounts.set(executorAndChannel, logEntry.extra.count);
        const nowcount = disconnectCounts.get(executorAndChannel);
        if (nowcount <= 1) {
          setTimeout(async () => {
            disconnectCounts.delete(executorAndChannel);
          }, 50 * 1000 * 60);
        }
      } else {
        const embed2 = new EmbedBuilder()
        .setAuthor({ name: `${newState.member.user.username}`, iconURL: newState.member.displayAvatarURL()})
        .setDescription(`**<@${newState.member.user.id}>  Left => ** \`${oldChannel.name}\` `)
        .setTimestamp()
        .setFooter({ text: `${newState.member.user.username}`, iconURL: newState.member.displayAvatarURL()});
        webhookClient2.send({
          embeds: [embed2],
        });
        console.log(
          "Left: ",
          newState.member.user.username,
          oldChannel.name,
        );

        // disconnect himself

        // await left(
        //   logsChannel,
        //   oldChannel,
        //   newState.member.user,
        //   logsClass.data.disconnect.hexColor
        // );
      }
    }
  
});

client.on("voiceStateUpdate", async (oldState, newState) => {
  // MOVE
  const newguild = newState.guild;
  const logMoveChannel = true;
  const logJoinChannel = true;
  const logSwitchChannel = true;
  const auditLogs = await newguild.fetchAuditLogs({
    type: AuditLogEvent.MemberMove,
    limit: 100,
  });
  const newChannel = newState.channel;
  const oldChannel = oldState.channel;
  if (oldState.channel && newState.channel) {
    if (logMoveChannel) {
      // MOVE
      if (oldState.channel.id !== newState.channel.id) {
        const logEntry = await getLogsEntry(auditLogs, newChannel);
        if (logEntry && logEntry.executorId !== newState.member.user.id) {
          const executorAndChannel = `${logEntry?.executor.id}_${newChannel.id}`;
          if (!executorsCounts.has(executorAndChannel)) {
            executorsCounts.set(executorAndChannel, 0);
          }

          executorsCounts.set(executorAndChannel, logEntry.extra.count);
          const nowcount = executorsCounts.get(executorAndChannel);
          if (nowcount <= 1) {
            setTimeout(async () => {
              executorsCounts.delete(executorAndChannel);
            }, 50 * 1000 * 60);
          }

        const embed3 = new EmbedBuilder()
        .setAuthor({ name: newState.member.user.username, iconURL: newState.member.user.displayAvatarURL()})
        .setDescription(`**🔁 <@${newState.member.user.id}>  Moved \n \`${oldChannel.name}\`=>\`${newChannel.name}\`** `)
        .addFields({ name: '<:discord_ban:1208612199023640597>  Responsable Moderator :', value: `<@${logEntry.executor.id}>`})
        .setTimestamp()
        .setFooter({ text: `${logEntry.executor.username}`, iconURL: logEntry.executor.displayAvatarURL()});
        webhookClient3.send({
          embeds: [embed3],
        });
          console.log(
            "Move: ",
            logEntry.executor.username,
            newState.member.user.username,
            oldChannel.name,
            newChannel.name
          );
          // return await move(
          //   logsChannel,
          //   oldChannel,
          //   newChannel,
          //   newState.member.user,
          //   logEntry.executor,
          //   logsClass.data.move.hexColor
          // );
        } else {
          if (logSwitchChannel) {
            // SWITCH
            const link2 = `https://discord.com/channels/${newguild.id}/${newChannel.id}`; 
            const embed4 = new EmbedBuilder()
            .setAuthor({ name: newState.member.user.username, iconURL: newState.member.displayAvatarURL()})
            .setURL(link2)
            .setDescription(`** <@${newState.member.user.id}> has Switched From \n \`${oldChannel.name}\` => \`${newChannel.name}\`**`)
            .setTimestamp()
            .setFooter({ text: 'Tudo Nosso' , iconURL :'https://cdn.discordapp.com/attachments/1163311346369179659/1171457553159438386/38c350ad1c49cc2c71e38082cebe8701.jpg?ex=655cbfdd&is=654a4add&hm=942be07e5aac8bb41c08a22a78a086dee77c558ad88a8060abea2173d83aac0a&'});
            webhookClient4.send({
              embeds: [embed4],
            });
            console.log(
              "SWITCH: ",
              newState.member.user.username,
              oldChannel.name,
              newChannel.name
            );
          }
          // return await switched(
          //   logsChannel,
          //   oldChannel,
          //   newChannel,
          //   newState.member.user,
          //   logsClass.data.move.hexColor
          // );
        }
      }
    }
  } else if (!oldChannel && newChannel) {
    if (logJoinChannel) {
      // JOIN
      const logEntry = await getLogsEntry(auditLogs, newChannel);
      if (!logEntry) {
        const link1 = `https://discord.com/channels/${newguild.id}/${newChannel.id}`;  
           const embed5 = new EmbedBuilder()
        .setAuthor({ name: newState.member.user.username, iconURL: newState.member.user.displayAvatarURL()}  )
        .setURL(link1)
        .setDescription(`**<@${newState.member.user.id}> has joined  => \`${newChannel.name}\`** `)
        .setTimestamp()
        .setFooter({ text: 'Tudo Nosso' , iconURL :'https://cdn.discordapp.com/attachments/1163311346369179659/1171457553159438386/38c350ad1c49cc2c71e38082cebe8701.jpg?ex=655cbfdd&is=654a4add&hm=942be07e5aac8bb41c08a22a78a086dee77c558ad88a8060abea2173d83aac0a&'});
        webhookClient5.send({
          embeds: [embed5],
        });
        console.log('hiiiiii')
      }
    }
  }
});
client.on("voiceStateUpdate", async (oldState, newState) => {
  // Mute
  const oneSAgo = Date.now() - 1000 * 60 * 5;
  try {
    const guild = oldState.guild;
      const fetchedLogs = await guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.MemberUpdate,
      });
      if (oldState.serverMute !== newState.serverMute) {
        if (newState.serverMute) {
          const muteLog = fetchedLogs.entries.find(
            (entry) => entry.createdAt.getTime() >= oneSAgo
          );
          if (muteLog) {
            const { executor, target } = muteLog;
            if (target && executor) { 
              const embedmute = new EmbedBuilder()
                .setAuthor({ name: target.username, iconURL: target.displayAvatarURL() || "" })
                .setDescription(`**<@${target.id}> Server Muted :zipper_mouth:** `)
                .addFields({ name: '<:discord_ban:1208612199023640597>  Responsible Moderator:', value: `<@${executor.id}>` })
                .setTimestamp()
                .setFooter({ text: `${executor.username}`, iconURL: executor.displayAvatarURL() || "" });
              webhookClient6.send({
                embeds: [embedmute],
              });
            }
          }
        }
      }
    
  } catch (err) {
    console.error(err);
  }
});


client.on("voiceStateUpdate", async (oldState, newState) => {
  // Unmute:
const oneSAgo = Date.now() - 1000 * 60 * 5;
try {
  
  const guild = oldState.guild;
    const fetchedLogs = await guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.MemberUpdate,
    });
    if (oldState.mute !== newState.serverMute) {
      if (newState.serverMute) {
     
      } else {
        const muteLog = fetchedLogs.entries.find(
          (entry) => entry.createdAt.getTime() >= oneSAgo
        );
        if (muteLog) {
          const { executor, target } = muteLog;
          if (
            target?.id === oldState?.member.id &&
            executor &&
            target.id != executor?.id
          ) {
            const embedunmute = new EmbedBuilder()
            .setAuthor({ name: target.username, iconURL: target.displayAvatarURL() || "" })
            .setDescription(`** <@${target.id}> Server Unmuted ** `)
            .addFields({ name: '<:discord_ban:1208612199023640597>  Responsible Moderator:', value: `<@${executor.id}>` })
            .setTimestamp()
            .setFooter({ text: `${executor.username}`, iconURL: executor.displayAvatarURL() || "" });
          webhookClient7.send({
            embeds: [embedunmute],
      })
          }
        }
      }
    }
  
} catch (err) {
  console.error(err);
}
})

client.on("voiceStateUpdate", async (oldState, newState) => {
  // deafen:
try {
  const oneSAgo = Date.now() - 1000;
  const guild = oldState.guild;
    const fetchedLogs = await guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.MemberUpdate,
    });
    if (oldState.serverMute !== newState.serverMute) {
    } else if (oldState.serverDeaf !== newState.serverDeaf) {
      if (newState.serverDeaf) {
        const muteLog = fetchedLogs.entries.find(
          (entry) => entry.createdAt.getTime() >= oneSAgo
        );
        if (muteLog) {
          const { executor, target } = muteLog;
          if (
            target.id === oldState.member.id &&
            executor &&
            target.id != executor?.id
          ) {
            const embeddeaf = new EmbedBuilder()
            .setAuthor({ name: target.username, iconURL: target.displayAvatarURL() || "" })
            .setDescription(`**<:deafeneed:1171692765541830656> ≡ <@${target.id}> Server Deafen ** `)
            .setThumbnail(`${target.displayAvatarURL() || ""}`)
            .addFields({ name: '<:discord_ban:1208612199023640597>  Responsible Moderator:', value: `<@${executor.id}>` })
            .setTimestamp()
            .setFooter({ text: `${executor.username}`, iconURL: executor.displayAvatarURL() || "" });
          webhookClient8.send({
            embeds: [embeddeaf],
      })
          }
        }
      }
    }
  
} catch (err) {
  console.error(err);
}
})

client.on("voiceStateUpdate", async (oldState, newState) => {
  // Undeafen
const oneSAgo = Date.now() - 1000 * 60 * 5;
try {
  const guild = oldState.guild;
    const fetchedLogs = await guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.MemberUpdate,
    });
    if (oldState.serverMute !== newState.serverMute) {

    } else if (oldState.serverDeaf !== newState.serverDeaf) {
      if (newState.serverDeaf) {
       
      } else {
        const muteLog = fetchedLogs.entries.find(
          (entry) => entry.createdAt.getTime() >= oneSAgo
        );
        if (muteLog) {
          const { executor, target } = muteLog;
          if (
            target.id === oldState.member.id &&
            executor &&
            target.id != executor?.id
          ) {
            const embedundeaf = new EmbedBuilder()
            .setAuthor({ name: target.username, iconURL: target.displayAvatarURL() || "" })
            .setDescription(`** <:unDeaafen:1171692762421276682> <@${target.id}> Server Undeafen ** `)
            .setThumbnail(`${target.displayAvatarURL() || ""}`)
            .addFields({ name: '<:discord_ban:1208612199023640597>  Responsible Moderator:', value: `<@${executor.id}>` })
            .setTimestamp()
            .setFooter({ text: `${executor.username}`, iconURL: executor.displayAvatarURL() || "" });
          webhookClient9.send({
            embeds: [embedundeaf],
      })          }
        }
      }
    }
  
} catch (err) {
  console.error(err);
}
})

//////////
});



async function getLogsEntry(auditLogs, newChannel) {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  const data = auditLogs.entries?.find(
    (entry) =>
      entry.extra.channel.id === newChannel.id &&
      Number(entry.extra.count) !==
        Number(
          executorsCounts.get(`${entry.executor.id}_${newChannel.id}`)
            ? executorsCounts.get(`${entry?.executor.id}_${newChannel.id}`)
            : 0
        ) &&
      entry.createdAt.getTime() >= fiveMinutesAgo
  );
  if (data) {
    return data;
  } else {
    return null;
  }
}
client.login(config.token);