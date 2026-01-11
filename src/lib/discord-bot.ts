import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import { applicationConfig, hasPriorityRole } from './config';
import type { Application, Ticket } from './types';

// Verify this is running on server
if (typeof window !== 'undefined') {
  throw new Error('discord-bot.ts should only be used on the server side');
}

let client: Client | null = null;
let isReady = false;
const messageQueue: Array<{ userId: string; status: 'approved' | 'denied'; reason?: string; retries: number }> = [];
const channelMessageQueue: Array<{ message: string; channelId?: string; retries: number }> = [];

export function initializeDiscordBot() {
  if (!process.env.DISCORD_BOT_TOKEN) {
    console.error('DISCORD_BOT_TOKEN is not set in the environment variables');
    return;
  }

  if (client) {
    console.log('Discord bot already initialized');
    return;
  }

  client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages, GatewayIntentBits.GuildMembers],
  });

  try {
    client.on('ready', () => {
      console.log(`Discord bot logged in as ${client!.user?.tag || 'Unknown'}!`);
      isReady = true;
      processMessageQueue();
      processChannelMessageQueue();
      setInterval(() => {
        if (isReady && messageQueue.length > 0) {
          console.log(`Processing ${messageQueue.length} queued messages...`);
          processMessageQueue();
        }
        if (isReady && channelMessageQueue.length > 0) {
          console.log(`Processing ${channelMessageQueue.length} queued channel messages...`);
          processChannelMessageQueue();
        }
      }, 30000);
    });

    client.on('error', (error) => {
      console.error('Discord client error:', error);
      isReady = false;
    });

    client.on('disconnect', () => {
      console.log('Discord bot disconnected');
      isReady = false;
    });

    client.on('guildMemberUpdate', async (oldMember, newMember) => {
      try {
        const oldRoles = oldMember.roles.cache.map(r => r.name);
        const newRoles = newMember.roles.cache.map(r => r.name);
        
        // Check if roles actually changed
        if (JSON.stringify(oldRoles.sort()) === JSON.stringify(newRoles.sort())) {
          return;
        }

        console.log(`Roles changed for user ${newMember.user.id} (${newMember.user.username})`);
        console.log(`Old roles: ${oldRoles.join(', ')}`);
        console.log(`New roles: ${newRoles.join(', ')}`);

        // Check for priority roles using config
        const hadPriorityRole = hasPriorityRole(oldRoles);
        const hasPriorityRoleNow = hasPriorityRole(newRoles);

        // Only update if priority status changed
        if (hadPriorityRole !== hasPriorityRoleNow) {
          await updateApplicationPriority(newMember.user.id, hasPriorityRoleNow);
        }
      } catch (error) {
        console.error('Error handling role update:', error);
      }
    });

    client.login(process.env.DISCORD_BOT_TOKEN);
  } catch (error) {
    console.error('Failed to initialize Discord bot:', error);
  }
}

async function updateApplicationPriority(userId: string, hasPriorityRole: boolean): Promise<void> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    // Fetch pending applications for this user
    const response = await fetch(`${baseUrl}/api/applications`);
    if (!response.ok) {
      console.error('Failed to fetch applications');
      return;
    }

    const applications = await response.json();
    const userApplication = applications.find((app: Application) => 
      app.discord?.id === userId && app.status === 'pending'
    );

    if (!userApplication) {
      console.log(`No pending application found for user ${userId}`);
      return;
    }

    const newPriority = hasPriorityRole ? 'high' : 'normal';
    const oldPriority = userApplication.priority || 'normal';

    // Only update if priority actually changed
    if (oldPriority === newPriority) {
      return;
    }

    // Update the application priority using system authentication
    const updateResponse = await fetch(`${baseUrl}/api/applications/${userApplication.id}/priority`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        priority: newPriority,
        systemUpdate: process.env.NEXTAUTH_SECRET
      })
    });

    if (updateResponse.ok) {
      console.log(`Updated application ${userApplication.id} priority from ${oldPriority} to ${newPriority}`);
      
      // Send notification about priority change
      await sendChannelMessage(
        `🔔 Application priority auto-updated: ${userApplication.username || userApplication.discord.username} (${oldPriority} → ${newPriority}) due to role change`
      );
    } else {
      console.error('Failed to update application priority');
    }
  } catch (error) {
    console.error('Error updating application priority:', error);
  }
}

// In-memory cache for user roles with 2-minute expiry
const rolesCache = new Map<string, { roles: string[]; timestamp: number }>()
const ROLES_CACHE_DURATION = 2 * 60 * 1000 // 2 minutes

export async function getUserRoles(userId: string): Promise<string[]> {
  // Check cache first
  const cached = rolesCache.get(userId)
  if (cached && Date.now() - cached.timestamp < ROLES_CACHE_DURATION) {
    return cached.roles
  }

  // Initialize bot if not already initialized
  if (!client) {
    console.log('Discord bot not initialized, initializing now...')
    initializeDiscordBot()
  }

  // Wait for bot to be ready with reduced timeout (1 second)
  let attempts = 0
  const maxAttempts = 2 // 2 attempts * 500ms = 1 second timeout

  while (!isReady && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 500))
    attempts++
  }

  if (!isReady) {
    console.debug('Discord bot not ready, returning cached or empty roles')
    // Return cached value even if expired, or empty array
    return cached ? cached.roles : []
  }

  const guildId = process.env.DISCORD_GUILD_ID
  if (!guildId) {
    throw new Error('DISCORD_GUILD_ID not set')
  }
  const guild = client!.guilds.cache.get(guildId)
  if (!guild) {
    throw new Error('Guild not found')
  }
  try {
    const member = await guild.members.fetch(userId)
    const roles = member.roles.cache.map(role => role.name)
    
    // Cache the result
    rolesCache.set(userId, { roles, timestamp: Date.now() })
    
    return roles
  } catch (error) {
    console.error('Error fetching member roles:', error)
    // Return cached value even if expired, or empty array
    return cached ? cached.roles : []
  }
}

export async function sendChannelMessage(message: string, channelId?: string): Promise<void> {
  if (!client) {
    console.log('Discord bot not initialized, initializing now...');
    initializeDiscordBot();
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  if (!isReady) {
    console.log('Bot not ready, queuing channel message');
    channelMessageQueue.push({ message, channelId, retries: 0 });
    return;
  }

  try {
    await sendChannelMessageInternal(message, channelId);
  } catch (error) {
    console.error('Failed to send channel message, queuing for retry:', error);
    channelMessageQueue.push({ message, channelId, retries: 0 });
  }
}

async function sendChannelMessageInternal(message: string, channelId?: string): Promise<void> {
  if (!client || !isReady) {
    throw new Error('Discord bot not ready for channel message');
  }
  const chId = channelId || process.env.DISCORD_NOTIFICATION_CHANNEL_ID;
  if (!chId) {
    throw new Error('No notification channel ID set');
  }
  try {
    const channel = client.channels.cache.get(chId);
    if (channel?.isTextBased()) {
      await (channel as { send: (msg: string) => Promise<unknown> }).send(message);
      console.log(`Channel message sent successfully to ${chId}`);
    } else {
      throw new Error('Channel not found or not text-based');
    }
  } catch (error) {
    console.error('Error sending channel message:', error);
    throw error;
  }
}

async function processChannelMessageQueue() {
  if (!isReady || channelMessageQueue.length === 0) return;

  console.log(`Processing ${channelMessageQueue.length} queued channel messages...`);

  const queuedMessage = channelMessageQueue.shift();
  if (!queuedMessage) return;

  try {
    await sendChannelMessageInternal(queuedMessage.message, queuedMessage.channelId);
    console.log('Queued channel message sent successfully');
  } catch (error) {
    console.error('Failed to send queued channel message:', error);
    if (queuedMessage.retries < 3) {
      queuedMessage.retries++;
      channelMessageQueue.unshift(queuedMessage);
      console.log(`Retrying channel message (attempt ${queuedMessage.retries}/3) in ${5000 * queuedMessage.retries}ms`);
      setTimeout(() => processChannelMessageQueue(), 5000 * queuedMessage.retries);
    } else {
      console.error('Failed to send channel message after 3 retries - giving up');
    }
  }
  setTimeout(() => processChannelMessageQueue(), 1000);
}

async function processMessageQueue() {
  if (!isReady || messageQueue.length === 0) return;

  console.log(`Processing ${messageQueue.length} queued Discord messages...`);

  const message = messageQueue.shift();
  if (!message) return;

  try {
    await sendDirectMessageInternal(message.userId, message.status, message.reason);
    console.log(`Queued message sent to user ${message.userId}`);
  } catch (error) {
    console.error(`Failed to send queued message to user ${message.userId}:`, error);
    if (message.retries < 3) {
      message.retries++;
      messageQueue.unshift(message);
      console.log(`Retrying message to user ${message.userId} (attempt ${message.retries}/3) in ${5000 * message.retries}ms`);
      setTimeout(() => processMessageQueue(), 5000 * message.retries);
    } else {
      console.error(`Failed to send message to user ${message.userId} after 3 retries - giving up`);
    }
  }
  setTimeout(() => processMessageQueue(), 1000);
}

async function sendDirectMessageInternal(userId: string, status: 'approved' | 'denied', reason?: string): Promise<void> {
  if (!client) {
    throw new Error('Discord bot not initialized');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const timestampLong = `<t:${timestamp}:F>`;

  const embed = new EmbedBuilder()
    .setColor(status === 'approved' ? '#00FF00' : '#FF0000')
    .setAuthor({
      name: applicationConfig.discordBot.serverName,
      iconURL: applicationConfig.discordBot.serverIcon,
    })
    .setTitle('Whitelist Application Response')
    .setDescription(
      status === 'approved'
        ? `Hello there,\n\nAfter reviewing your application, we're excited to let you know that your whitelist application has been **ACCEPTED**! 🎉\n\nYour responses demonstrated a strong understanding of roleplay and alignment with our community values. We believe you'll be a great addition to our server!\n\n**Next Steps:**\n1. Join our Discord server if you haven't already\n2. Read the rules and guidelines in #server-rules\n3. Connect to the server using your whitelisted Steam account`
        : `Hello there,\n\nAfter careful consideration of your whitelist application, we regret to inform you that your application has been **DENIED** at this time.\n\nYou may reapply after a 14-day waiting period, taking into account the feedback provided.`
    )
    .addFields(
      {
        name: 'Application Status',
        value: status === 'approved' ? '✅ Accepted' : '❌ Denied',
        inline: true
      },
      {
        name: 'Decision Date',
        value: timestampLong,
        inline: true
      }
    );

  if (reason) {
    embed.addFields({
      name: status === 'approved' ? 'Staff Note' : 'Reason',
      value: reason,
      inline: false
    });
  }

  embed.setFooter({
    text: applicationConfig.discordBot.footerText,
    iconURL: applicationConfig.discordBot.serverIcon
  })
  .setTimestamp();

  if (status === 'approved') {
    embed.addFields({
      name: 'Important Information',
      value: 'Please make sure to read our server rules and guidelines before connecting. If you have any questions, our staff team is here to help!'
    });
  }

  try {
    const user = await Promise.race([
      client.users.fetch(userId),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('User fetch timeout')), 10000)
      )
    ]);

    if (!user) {
      throw new Error('User not found');
    }

    await Promise.race([
      user.send({ embeds: [embed] }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Message send timeout')), 10000)
      )
    ]);

    console.log(`Discord message sent successfully to user ${userId}`);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('Cannot send messages to this user')) {
      console.error(`Cannot send DM to user ${userId}: User has DMs disabled or bot is blocked`);
    } else if (errorMessage.includes('Missing Permissions')) {
      console.error(`Cannot send DM to user ${userId}: Bot lacks permissions`);
    } else if (errorMessage.includes('Unknown User')) {
      console.error(`Cannot send DM to user ${userId}: User not found`);
    } else {
      console.error(`Failed to send Discord message to user ${userId}:`, error);
    }
    throw error;
  }
}

export async function sendDirectMessage(userId: string, status: 'approved' | 'denied', reason?: string): Promise<void> {
  if (!client) {
    console.log('Discord bot not initialized, initializing now...');
    initializeDiscordBot();
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  if (!isReady) {
    console.log(`Bot not ready, queuing message for user ${userId}`);
    messageQueue.push({ userId, status, reason, retries: 0 });
    return;
  }

  try {
    await sendDirectMessageInternal(userId, status, reason);
  } catch (error) {
    console.error(`Immediate send failed for user ${userId}, queuing for retry:`, error);
    messageQueue.push({ userId, status, reason, retries: 0 });
    console.log(`Message queued for retry to user ${userId}`);
  }
}

export function getBotStatus() {
  return {
    initialized: !!client,
    ready: isReady,
    queueLength: messageQueue.length,
    channelQueueLength: channelMessageQueue.length,
    user: client?.user?.tag || null,
  };
}

export function forceProcessQueue() {
  if (isReady) {
    processMessageQueue();
    processChannelMessageQueue();
  }
}

export async function notifyTicketCreated(ticket: Ticket): Promise<void> {
  if (!isReady || !client) {
    console.warn('Discord bot not ready, cannot send ticket notification')
    return
  }
  const channelId = process.env.DISCORD_SUPPORT_CHANNEL_ID || process.env.DISCORD_NOTIFICATION_CHANNEL_ID
  if (!channelId) return
  try {
    const channel = await client.channels.fetch(channelId)
    if (!channel || !('send' in channel)) return
    const embed = new EmbedBuilder()
      .setColor('#FFA500')
      .setTitle('New Support Ticket')
      .setDescription(`**Subject:** ${ticket.subject}`)
      .addFields(
        { name: 'Category', value: ticket.category, inline: true },
        { name: 'Priority', value: ticket.priority, inline: true },
        { name: 'From', value: ticket.userEmail || 'Unknown', inline: false },
      )
      .setTimestamp()
    await channel.send({ embeds: [embed] })
  } catch (error) {
    console.error('Failed to send ticket notification:', error)
  }
}

export async function notifyTicketStatusChanged(ticket: Ticket, oldStatus: string): Promise<void> {
  if (!isReady || !client) {
    console.warn('Discord bot not ready, cannot send ticket status notification')
    return
  }
  const channelId = process.env.DISCORD_SUPPORT_CHANNEL_ID || process.env.DISCORD_NOTIFICATION_CHANNEL_ID
  if (!channelId) return
  try {
    const channel = await client.channels.fetch(channelId)
    if (!channel || !('send' in channel)) return
    const color = ticket.status === 'resolved' ? '#00FF00' : ticket.status === 'closed' ? '#FF0000' : '#FFA500'
    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle('Ticket Status Updated')
      .setDescription(`**Subject:** ${ticket.subject}`)
      .addFields(
        { name: 'Old Status', value: oldStatus.replace('_',' '), inline: true },
        { name: 'New Status', value: ticket.status.replace('_',' '), inline: true },
        { name: 'Category', value: ticket.category, inline: true },
      )
      .setTimestamp()
    await channel.send({ embeds: [embed] })
  } catch (error) {
    console.error('Failed to send status notification:', error)
  }
}
