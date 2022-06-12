const _ = require('lodash');
const Discord = require('discord.js');

class MessageManager {
  static PREFIX = '/';
  constructor(betfair) {
    this.betfair = betfair;
  }

  async onInteraction(interaction) {
    if (!interaction.isCommand()) return;

    if (interaction.commandName === 'ping') {
      const timeTaken = Date.now() - interaction.createdTimestamp;

      await interaction.reply(`Pong! This message had a latency of ${timeTaken}ms.`);
    }
    else if (interaction.commandName === 'next-event') {
      try {
        if (!this.betfair.sessionKey) {
          // console.log(process.env.VENDOR_USER, process.env.VENDOR_PASS);
          await this.betfair.login(process.env.VENDOR_USER, process.env.VENDOR_PASS);
          // this.getNextAvailableHorseRace(message);

          this.betfair.listEventTypes({
            filter: {},
          },
            async (err, { error, result }) => {
              console.log(result);
            });
        }
      } catch (error) {
        console.log(error);
      }
    }
  }

  async getNextAvailableHorseRace(message) {
    this.betfair.listMarketCatalogue({
      filter: {
        marketCountries: ['GB'],
        marketTypeCodes: ['WIN'],
        marketStartTime: {
          from: new Date().toJSON()
        },
      },
      sort: 'FIRST_TO_START',
      maxResults: 1,
      marketProjection: ['COMPETITION', 'EVENT', 'EVENT_TYPE', 'MARKET_START_TIME', 'MARKET_DESCRIPTION', 'RUNNER_DESCRIPTION', 'RUNNER_METADATA']
    }, async (err, { error, result }) => {
      if (!error && !_.isEmpty(result) && !_.isEmpty(result[0])) {
        const raceInfo = result[0];
        const runners = raceInfo.runners.reduce((total, runner) => total + '\n' + runner.runnerName)
        console.log(raceInfo);

        // const messageParts = new Discord.MessageEmbed()
        // .addField(`https://www.betfair.com/exchange/plus/horse-racing/market/1.200066572`)
        // .addField(runners)

        // await interaction.reply(messageParts);
      }
    });
  }
}

module.exports = MessageManager;
