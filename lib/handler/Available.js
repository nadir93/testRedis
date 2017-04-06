/**
 * Author @nadir93
 * Date 2017.4.5
 */
'use strict';

const loglevel = 'info';
const Logger = require('bunyan');
const log = new Logger.createLogger({
  name: 'Available',
  level: loglevel,
  serializers: {
    req: Logger.stdSerializers.req
  }
});
const url = require('url');
const AbstractHandler = require('./AbstractHandler');
const WaitingManager = require('../WaitingManager');
const ttl = 100; //second
const testValue = '123';

class Available extends AbstractHandler {

  constructor(redis) {
    super();
    this.manager = new WaitingManager(redis);
    this.redis = redis;
  }

  handle(req, res) {
    const parsedObj = url.parse(req.url, true);
    log.debug('parsedObj: ', parsedObj);

    log.debug('key: ', 'active:' + parsedObj.query.url +
      ':' + parsedObj.query.id);
    // this.redis.exists('active:' + parsedObj.query.url +
    //     ':' + parsedObj.query.id)
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
        //log.debug('active:' + parsedObj.query.url + ':' +
        //  parsedObj.query.id + (result ? ' key exists' :
        //    ' key does not exists'));
        //return result ? this.keyExistsInActiveQ(parsedObj) :
        //  this.keyDoesNotExistsInActiveQ(parsedObj);
      //})
      //.then(result => {
        log.debug('available handle result: ', result);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result));
      })
      .catch(e => {
        log.error(e);
        res.statusCode = 500;
        res.end(e.message);
      });
  }

  keyExistsInActiveQ(parsedObj) {
    return new Promise((resolve, reject) => {
      this.redis.expire('active:' + parsedObj.query.url +
          ':' + parsedObj.query.id, ttl)
        .then(result => {
          log.debug('expire set result: ', result);
          resolve({
            scenario: '#1'
          });
        })
        .catch(e => {
          log.error(e);
          reject(e);
        });
    });
  }

  keyDoesNotExistsInActiveQ(parsedObj) {
    return new Promise((resolve, reject) => {
      this.manager.enqueue(parsedObj)
        .then(result => {
          log.debug('waiting manager result: ', result);
          resolve(result);
        })
        .catch(e => {
          log.error(e);
          reject(e);
        });
    });
  }
}

module.exports = Available;
