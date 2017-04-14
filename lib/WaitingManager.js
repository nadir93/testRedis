/**
 * Author @nadir93
 * Date 2017.4.5
 */
'use strict';

const loglevel = 'debug';
const Logger = require('bunyan');
const log = new Logger.createLogger({
  name: 'WaitingManager',
  level: loglevel,
  serializers: {
    req: Logger.stdSerializers.req
  }
});
const EventEmitter = require('events');
const Promoter = require('./Promoter');
const ttl = 100; //second
const testValue = '123';
const maxActiveCount = {
  '/test/url': 100
};

class WaitingManager extends EventEmitter {

  constructor(redis) {
    super();
    this.redis = redis;
    this.promoter = new Promoter(redis);
    this.init();
  }

  init() {
    // setInterval(function() {
    //   log.debug('interval test');
    // }, 1000);
  }

  enqueue(parsedObj) {
    return new Promise((resolve, reject) => {
      log.debug('parsedObj: ', parsedObj);

      this.redis.check_waiting('active:' + parsedObj.pathname +
          ':' + parsedObj.query.id, 'activeQ:' + parsedObj.pathname,
          'waitingQ:' + parsedObj.pathname, 'waiting:' + parsedObj.pathname +
          ':' + parsedObj.query.id,
          maxActiveCount[parsedObj.pathname],
          parsedObj.query.id, ttl, testValue)
        .then(result => {
          log.debug('lua result: ', result);
          resolve(result);
        })
        .catch(e => {
          log.error(e);
          reject(e);
        });
    });
  }
}

module.exports = WaitingManager;
