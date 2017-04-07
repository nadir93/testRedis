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

      this.redis.pipeline()
        .exists('active:' + parsedObj.query.url +
          ':' + parsedObj.query.id)
        .expire('active:' + parsedObj.query.url +
          ':' + parsedObj.query.id, ttl)
        .scard('activeQ:' + parsedObj.query.url)
        .setex('waiting:' + parsedObj.query.url +
          ':' + parsedObj.query.id, ttl, testValue)
        .zcard('waitingQ:' + parsedObj.query.url)
        .zrank('waitingQ:' + parsedObj.query.url, parsedObj.query.id)
        .exec()
        .then(result => {
          log.debug('pipeline result: ', result);
          log.debug('exists result: ', result[0]);
          log.debug('expire result: ', result[1]);
          log.debug('scard result: ', result[2]);
          log.debug('setex result: ', result[3]);
          log.debug('zcard result: ', result[4]);
          log.debug('zrank result: ', result[5]);

          const activeCount = result[2][1];
          return result[0][1] && result[2][1] ?
            this.responseScenarioOne() :
            this.checkActiveQ(parsedObj, activeCount, result);
        })
        .then(result => {
          resolve(result);
        })
        .catch(e => {
          log.error(e);
          reject(e);
        });
    });
  }

  responseScenarioOne() {
    return new Promise((resolve, reject) => {
      resolve({
        'scenario': '#1'
      });
    });
  }

  checkActiveQ(parsedObj, activeCount, data) {
    return activeCount < maxActiveCount[parsedObj.query.url] ?
      this.promoter.promote(parsedObj) :
      this.isExistsRank(parsedObj, data);
  }

  isExistsRank(parsedObj, data) {
    return data[5][1] != null ?
      this.responseScenarioThree() :
      this.addWaitingQ(parsedObj);
  }

  responseScenarioThree() {
    return new Promise((resolve, reject) => {
      resolve({
        'scenario': '#3'
      });
    });
  }

  addWaitingQ(parsedObj) {
    return new Promise((resolve, reject) => {
      this.redis.zadd('waitingQ:' +
          parsedObj.query.url, +new Date(), parsedObj.query.id)
        .then(() => {
          resolve({
            'scenario': '#4'
          });
        })
        .catch(e => {
          log.error(e);
          reject(e);
        });
    });
  }
}

module.exports = WaitingManager;
