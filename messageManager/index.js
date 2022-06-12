const _ = require('lodash');
const moment = require('moment');
const { MessageEmbed } = require('discord.js');
const { CHARACTER_LIMIT, ALLOWED_CHANNELS, eventChoices } = require('../constants');

class MessageManager {
  constructor(betfair) {
    this.betfair = betfair;
  }

  async onInteraction(interaction) {
    if (!interaction.isCommand() || !ALLOWED_CHANNELS.includes(interaction.channelId)) return;

    if (interaction.commandName === 'next-event') {
      await this.betfair.login(process.env.VENDOR_USER, process.env.VENDOR_PASS);
      const sportId = interaction.options.getString('sport');
      this.getNextAvailableMarket(interaction, sportId);
    }
    else if (interaction.commandName === 'horse-race') {
      try {
        if (!this.betfair.sessionKey) {
          await this.betfair.login(process.env.VENDOR_USER, process.env.VENDOR_PASS);
          this.getNextAvailableMarket(interaction, '7');
        }
      } catch (error) {
        console.log(error);
      }
    }
  }

  async getNextAvailableMarket(interaction, eventTypeId) {
    const marketFilter = {
      eventTypeIds: [eventTypeId],
      marketStartTime: {
        from: new Date().toJSON()
      },
    }

    if (eventTypeId === '7') {
      marketFilter.marketTypeCodes = ['WIN'];
    }

    this.betfair.listMarketCatalogue({
      filter: marketFilter,
      sort: 'FIRST_TO_START',
      maxResults: 1,
      marketProjection: ['COMPETITION', 'EVENT', 'EVENT_TYPE', 'MARKET_START_TIME', 'MARKET_DESCRIPTION', 'RUNNER_DESCRIPTION', 'RUNNER_METADATA']
    }, async (err, { error, result }) => {
      if (!error && !_.isEmpty(result) && !_.isEmpty(result[0])) {
        const raceInfo = result[0];
        const runners = raceInfo.runners.map(runner => runner.runnerName).join('\n').substring(0, CHARACTER_LIMIT);
        const { marketId, marketStartTime, competition, eventType, event } = raceInfo;

        const messageEmbed = new MessageEmbed()
          .setTitle(`${event.venue || event.name} ${moment(marketStartTime).calendar()}`)
          .addFields(
            { name: 'Sport', value: eventType.name },
            { name: 'Competition / Event', value: competition && competition.name || event.name || '' },
            { name: 'Markets', value: runners && runners.toString() || '' },
            { name: 'Market link', value: `https://www.betfair.com/exchange/plus/market/${marketId}` },
          );

        await interaction.reply({ embeds: [messageEmbed] });
      }
    });
  }
}

module.exports = MessageManager;
