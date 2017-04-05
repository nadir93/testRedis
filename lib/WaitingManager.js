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
const ttl = 10; //second
//let waitingCount = 0;

class WaitingManager extends EventEmitter {

  constructor(redis) {
    super();
    this.redis = redis;
  }

  enqueue(parsedObj) {
    return new Promise((resolve, reject) => {
      log.debug('key: ', 'waiting:' + parsedObj.query.url +
        ':' + parsedObj.query.id);
      this.redis.exists('waiting:' + parsedObj.query.url +
          ':' + parsedObj.query.id)
        .then(result => {
          log.debug('exists result: ', result);
          return result ? this.keyExists(parsedObj) :
            this.KeyDoesNotExists(parsedObj);
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

  keyExists(parsedObj) {
    return new Promise((resolve, reject) => {
      let waitingCount;
      this.redis.expire('waiting:' + parsedObj.query.url +
          ':' + parsedObj.query.id, ttl)
        .then(result => {
          log.debug('expire result: ', result);
          log.debug('key: ', 'waiting:' + parsedObj.query.url);
          return this.redis.zcard('waiting:' + parsedObj.query.url);
        })
        .then(result => {
          waitingCount = result;
          log.debug('waitingCount: ', waitingCount);
          return this.redis.zrank('waiting:' +
            parsedObj.query.url, parsedObj.query.id);
        })
        .then(result => {
          log.debug('rank: ', result);
          resolve({
            code: 200,
            rank: result,
            count: waitingCount
          });
        })
        .catch(e => {
          log.error(e);
          reject(e);
        });
    });
  }

  KeyDoesNotExists(parsedObj) {
    return new Promise((resolve, reject) => {
      //log.debug('waitingCount: ', waitingCount);
      resolve(0);
    });
  }
}

// function getWaitingCount() {
//   redis.zcard('waiting', function(err, result) {
//     if (err) {
//       log.error(e);
//       return;
//     }
//     log.debug('waitingCount: ', result);
//     waitingCount = result;
//   });
// }
//
// const redis = new Redis(port, host);
//
// redis.on('connect', function() {
//   log.info('redis connect');
// });
//
// redis.on('ready', function() {
//   log.info('redis ready');
// });
//
// redis.on('error', function(error) {
//   log.error(error);
// });
//
// redis.on('close', function() {
//   log.info('redis close');
// });
//
// redis.on('reconnecting', function(event) {
//   log.info('reconnecting event: ', event);
// });
//
// redis.on('end', function() {
//   log.info('redis end');
// });

//const waitingManager = new WaitingManager();
//schedule.scheduleJob('*/5 * * * * *', getWaitingCount);
module.exports = WaitingManager;
