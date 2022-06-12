const _ = require('lodash');
const Discord = require('discord.js');

class MessageManager {
  static PREFIX = '!';
  constructor(betfair) {
    this.betfair = betfair;
  }

  async onMessageInput(message) {
    if (message.author.bot) return;
    if (!message.content.startsWith(MessageManager.PREFIX)) return;

    const commandBody = message.content.slice(MessageManager.PREFIX.length);
    const args = commandBody.split(' ');
    const command = args.shift().toLowerCase();

    if (command === 'ping') {
      const timeTaken = Date.now() - message.createdTimestamp;
      message.reply(`Pong! This message had a latency of ${timeTaken}ms.`);
    }

    else if (command === 'sum') {
      const numArgs = args.map(x => parseFloat(x));
      const sum = numArgs.reduce((counter, x) => counter += x);
      message.reply(`The sum of all the arguments you provided is ${sum}!`);
    }

    try {
      if (!this.betfair.sessionKey) {
        console.log(process.env.VENDOR_USER, process.env.VENDOR_PASS);
        await this.betfair.login(process.env.VENDOR_USER, process.env.VENDOR_PASS);
        this.getNextAvailableHorseRace(message);
      }
    } catch (error) {
      console.log(error);
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

        // message.reply(messageParts);
      }
    });
  }
}

module.exports = MessageManager;
