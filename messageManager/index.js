const _ = require('lodash');
const moment = require('moment');
const { MessageEmbed } = require('discord.js');
const { CHARACTER_LIMIT, ALLOWED_CHANNELS, eventChoices } = require('../constants');

class MessageManager {
  constructor(betfair) {
    this.betfair = betfair;
    this.divider = '---------------';
  }

  async onInteraction(interaction) {
    if (!interaction.isCommand() || !ALLOWED_CHANNELS.includes(interaction.channelId)) return;

    await this.connectToBetfair();

    if (interaction.commandName === 'next-market') {
      this.getNextMarket(interaction);
    }
    else if (interaction.commandName === 'next-horse-race') {
      this.getNextHorseRace(interaction);
    }
    else if (interaction.commandName === 'get-market') {
      this.getMarket(interaction);
    }
  }

  async getNextMarket(interaction) {
    const sportId = interaction.options.getString('sport');
    this.getNextAvailableMarket(interaction, sportId);
  }

  async getNextHorseRace(interaction) {
    this.getNextAvailableMarket(interaction, '7');
  }

  async getMarket(interaction) {
    const marketId = interaction.options.getString('marketid');
    this.getNextAvailableMarket(interaction, null, marketId);
  }

  async connectToBetfair() {
    if (!this.betfair.sessionKey) {
      await this.betfair.login(process.env.VENDOR_USER, process.env.VENDOR_PASS);
    }
  }

  async resetBetFairAuth() {
    this.betfair.setSession(null);
  }

  async getNextAvailableMarket(interaction, eventTypeId, marketId) {
    const marketFilter = {
      marketStartTime: {
        from: new Date().toJSON()
      },
    }

    if (marketId) {
      marketFilter.marketIds = [marketId];
    }

    if (eventTypeId) {
      marketFilter.eventTypeIds = [eventTypeId];
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
      if (error) {
        if (error.data && error.data.APINGException) {
          this.resetBetFairAuth();
          this.connectToBetfair();
        }
      }
      else if (!_.isEmpty(result) && !_.isEmpty(result[0])) {
        const raceInfo = result[0];
        const runnerNames = {};
        let marketInfo = raceInfo.runners.map(runner => {
          runnerNames[runner.selectionId] = runner.runnerName;
          return runner.runnerName;
        }).join(`\n${this.divider}`).substring(0, CHARACTER_LIMIT);
        const { marketId, marketStartTime, competition, eventType, event } = raceInfo;

        const messageEmbed = new MessageEmbed()
          .setTitle(`${event.venue || event.name} ${moment(marketStartTime).calendar()}`)
          .addFields(
            { name: 'Sport', value: eventType.name },
            { name: 'Competition / Event', value: competition && competition.name || event.name || '' }
          );

        this.betfair.listMarketBook({
          marketIds: [marketId],
          priceProjection: {
            priceData: ['EX_BEST_OFFERS', 'EX_ALL_OFFERS', 'EX_TRADED'],
            exBestOfferOverRides: {
              bestPricesDepth: 2,
              rollupModel: 'STAKE',
              rollupLimit: 20
            },
            virtualise: false,
            rolloverStakes: false
          },
          orderProjection: 'ALL',
          matchProjection: 'ROLLED_UP_BY_PRICE'
        }, async (err, { error, result }) => {
          if (!error && !_.isEmpty(result) && !_.isEmpty(result[0])) {
            const marketBook = result[0];
            const { status, totalMatched, lastMatchTime, runners } = marketBook;

            marketInfo = runners.map(runner => {
              const parts = ['', runnerNames[runner.selectionId]];

              if (runner.lastPriceTraded) {
                const tradedPart = `Last Traded Price @ ${runner.lastPriceTraded}`;
                parts.push(tradedPart);
              }
              if (runner.totalMatched) {
                const totalMatchedPart = `Total Matched ${runner.totalMatched}`;
                parts.push(totalMatchedPart);
              }

              return parts.join('\n')
            }).join(`\n${this.divider}`).substring(0, CHARACTER_LIMIT);

            messageEmbed.addFields(
              { name: 'Status', value: status.toString() },
              { name: 'Markets', value: marketInfo ? marketInfo.toString() : '' },
              { name: 'Total Matched', value: totalMatched.toString() },
              { name: 'Last Matched Time', value: moment(lastMatchTime).calendar().toString().toLocaleLowerCase() },
              { name: 'Market link', value: `https://www.betfair.com/exchange/plus/market/${marketId}` }
            );
          } else {
            messageEmbed.addField('Markets', marketInfo ? marketInfo.toString() : '', false);
          }
          await interaction.reply({ embeds: [messageEmbed] });
        });
      }
    });
  }
}

module.exports = MessageManager;
