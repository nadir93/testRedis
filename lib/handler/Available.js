/**
 * Author @nadir93
 * Date 2017.4.5
 */
'use strict';

const loglevel = 'debug';
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
const ttl = 10; //second

class Available extends AbstractHandler {

  constructor(redis) {
    super();
    this.manager = new WaitingManager(redis);
    this.redis = redis;
  }

  handle(req, res) {
    var parsedObj = url.parse(req.url, true);
    log.debug('parsedObj: ', parsedObj);

    this.redis.exists('user:' + parsedObj.query.url + ':' + parsedObj.query.id)
      .then(result => {
        log.debug('exists result: ', result);
        return result ? this.keyExists(parsedObj) :
          this.KeyDoesNotExists(parsedObj);
      })
      .then(result => {
        log.debug('result: ', result);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        res.end();
      })
      .catch(e => {
        log.error(e);
        res.statusCode = 500;
        res.end(e.message);
      });
  }

  keyExists(parsedObj) {
    return new Promise((resolve, reject) => {
      this.redis.expire('user:' + parsedObj.query.url +
          ':' + parsedObj.query.id, ttl)
        .then(result => {
          log.debug('expire result: ', result);
          resolve(result);
        })
        .catch(e => {
          log.error(e);
          reject(e);
        });
    });
  }

  KeyDoesNotExists(parsedObj) {
    return new Promise((resolve, reject) => {
      this.manager.enqueue(parsedObj)
        .then(result => {
          log.debug('result: ', result);
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
