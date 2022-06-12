

class MessageManager {
  static PREFIX = '!';
  constructor(betfair) {
    this.betfair = betfair;
  }

  async onMessageInput(message) {
    console.log(message);
    if (message.author.bot) return;
    if (!message.content.startsWith(MessageManager.PREFIX)) return;

    const commandBody = message.content.slice(PREFIX.length);
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
      if (!betfair.sessionKey) {
        await betfair.login(process.env.VENDOR_USER, process.env.VENDOR_PASS);
      }
    } catch (error) {
      console.log(error);
    }
  }
}

module.exports = MessageManager;
