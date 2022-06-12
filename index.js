require('dotenv').config();
const Discord = require('discord.js');
const BetFairSession = require('./betfair/session');
const MessageManager = require('./messageManager');

const client = new Discord.Client({ intents: ['GUILDS', 'GUILD_MESSAGES'] });
const betfair = new BetFairSession(process.env.APP_KEY);
const messageManager = new MessageManager(betfair);

client.on('messageCreate', messageManager.onMessageInput);

client.login(process.env.BOT_TOKEN);
