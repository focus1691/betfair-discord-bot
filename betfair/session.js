/* eslint-disable class-methods-use-this */
const _ = require('lodash');
const auth = require('./auth.js');
const BetfairInvocation = require('./invocation.js');

// ************************************************************************
// * Accounts API - https://api.betfair.com:443/exchange/account/json-rpc/v1/
// ************************************************************************
const API_ACCOUNT_METHODS = [
  'createDeveloperAppKeys',
  'getDeveloperAppKeys',
  'getAccountDetails',
  'getAccountFunds',
  'getVendorClientId',
  'getVendorDetails',
  'getAccountStatement',
  'listCurrencyRates',
  'transferFunds',
  'token',
  'isAccountSubscribedToWebApp',
];

class BetfairSession {
  // Constructor
  constructor(applicationKey, sessionKey = null) {
    this.sessionKey = sessionKey;
    this.applicationKey = applicationKey;
    this.email = null;
    this.allSports = {};
    this.lastMenuUpdate = null;
    BetfairInvocation.setApplicationKey(applicationKey);

    this.createApiMethods('accounts', API_ACCOUNT_METHODS);
  }

  setSession(sessionKey) {
    this.sessionKey = sessionKey;
    BetfairInvocation.setSessionKey(sessionKey);
  }

  setEmailAddress(email) {
    this.email = email;
  }

  login(login, password) {
    return new Promise((res, rej) => {
      auth.loginInteractive(login, password, (error, result) => {
        if (error) rej(error);
        if (result) {
          this.setSession(result.sessionKey);
          this.setEmailAddress(login);
        }
        res(result);
      });
    });
  }

  keepAlive() {
    return new Promise((res, rej) => {
      auth.keepAlive(this.sessionKey, (err, result) => {
        if (err) rej(err);
        res(result);
      });
    });
  }

  logout() {
    return new Promise((res, rej) => {
      auth.logout(this.sessionKey, (err, result) => {
        if (err) rej(err);
        if (result) {
          this.sessionKey = null;
          this.email = null;
        }
        res(this);
      });
    });
  }

  // Create multiple Betfair API calls (account API, bettint api, etc)
  createApiMethods(api, methods) {
    methods.forEach((method) => {
      BetfairSession.prototype[method] = this.createMethod(api, method);
    });
  }

  // Arbitrary Betfair API RPC call constructor
  createMethod(api, methodName) {
    return function (params, callback = () => {}) {
      if (!_.isObject(params)) {
        throw ('params should be object');
      }
      const invocation = new BetfairInvocation(api, methodName, params);

      invocation.execute((err, result) => {
        if (err) {
          callback(err);
          return;
        }
        callback(null, result);
      });
      return invocation;
    };
  }
}

module.exports = BetfairSession;
