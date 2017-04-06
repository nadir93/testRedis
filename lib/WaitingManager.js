/**
 * Author @nadir93
 * Date 2017.4.5
 */
'use strict';

const loglevel = 'info';
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
  '/test/url': 0
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
      log.debug('key: ', 'waiting:' + parsedObj.query.url +
        ':' + parsedObj.query.id);
      this.redis.scard('activeQ:' + parsedObj.query.url)
        .then(activeCount => {
          log.debug('activeCount: ', activeCount);
          return (activeCount < maxActiveCount[parsedObj.query.url]) ?
            this.promoter.promote(parsedObj) :
            this.isExistsInWaitingQ(parsedObj);
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

  isExistsInWaitingQ(parsedObj) {
    return new Promise((resolve, reject) => {
      this.redis.exists('waiting:' + parsedObj.query.url +
          ':' + parsedObj.query.id)
        .then(result => {
          log.debug('waiting:' + parsedObj.query.url +
            ':' + parsedObj.query.id + (result ? ' key exists' :
              ' key does not exists'));
          return result ? this.keyExistsInWaitingQ(parsedObj) :
            this.keyDoesNotExistsInWaitingQ(parsedObj);
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

  keyExistsInWaitingQ(parsedObj) {
    return new Promise((resolve, reject) => {
      this.redis.pipeline()
        .expire('waiting:' + parsedObj.query.url +
          ':' + parsedObj.query.id, ttl)
        .zcard('waitingQ:' + parsedObj.query.url)
        .zrank('waitingQ:' + parsedObj.query.url, parsedObj.query.id)
        .exec()
        .then(result => {
          //[ [ null, 1 ], [ null, 1 ], [ null, 0 ] ]
          log.debug('keyExistsInWaitingQ expire result: ', result[0]);
          log.debug('keyExistsInWaitingQ zcard result: ', result[1]);
          log.debug('keyExistsInWaitingQ zrank result: ', result[2]);
          resolve({
            scenario: '#3',
            rank: result[2][1],
            count: result[1][1]
          });
        })
        .catch(e => {
          log.error(e);
          reject(e);
        });
    });
  }

  keyDoesNotExistsInWaitingQ(parsedObj) {
    return new Promise((resolve, reject) => {
      this.redis.pipeline()
        .setex('waiting:' + parsedObj.query.url +
          ':' + parsedObj.query.id, ttl, testValue)
        .zadd('waitingQ:' +
          parsedObj.query.url, +new Date(), parsedObj.query.id)
        .zcard('waitingQ:' + parsedObj.query.url)
        .zrank('waitingQ:' + parsedObj.query.url, parsedObj.query.id)
        .exec()
        .then(result => {
          //result:  [ [ null, 1 ], [ null, 1 ] ]
          log.debug('keyDoesNotExistsInWaitingQ setex result: ', result[0]);
          log.debug('keyDoesNotExistsInWaitingQ zadd result: ', result[1]);
          log.debug('keyDoesNotExistsInWaitingQ zcard result: ', result[2]);
          log.debug('keyDoesNotExistsInWaitingQ zrank result: ', result[3]);
          resolve({
            scenario: '#4',
            rank: result[3][1],
            count: result[2][1]
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
