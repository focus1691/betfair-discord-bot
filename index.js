require('dotenv').config();
const Discord = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const BetFairSession = require('./betfair/session');
const MessageManager = require('./messageManager');
const { eventChoices, GUILDS_LIST } = require('./constants');

const client = new Discord.Client({ intents: ['GUILDS', 'GUILD_MESSAGES'] });
const betfair = new BetFairSession(process.env.APP_KEY);
const messageManager = new MessageManager(betfair);

client.on('interactionCreate', messageManager.onInteraction.bind(messageManager));

client.login(process.env.BOT_TOKEN);

const commands = [
  new SlashCommandBuilder().setName('next-horse-race').setDescription('Get details of the next Horse Race'),
  new SlashCommandBuilder()
    .setName('next-market')
    .setDescription('Get details of the next market')
    .addStringOption(option =>
      option.setName('sport')
        .setDescription('The sport')
        .setRequired(true)
        .addChoices(...eventChoices)
    ),
  new SlashCommandBuilder()
    .setName('get-market')
    .setDescription('Get details of a market if you know the marketId')
    .addStringOption(option =>
      option.setName('marketid')
        .setDescription('The Market Id')
        .setRequired(true)
    ),
]
  .map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(process.env.BOT_TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    for (let i = 0; i < GUILDS_LIST.length; i++) {
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, GUILDS_LIST[i]),
        { body: commands },
      );
    }

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();
