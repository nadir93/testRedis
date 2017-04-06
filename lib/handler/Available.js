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

class Available extends AbstractHandler {

  constructor(redis) {
    super();
    this.manager = new WaitingManager(redis);
    this.redis = redis;
  }

  handle(req, res) {
    const parsedObj = url.parse(req.url, true);
    log.debug('parsedObj: ', parsedObj);

    log.debug('key: ', 'user:' + parsedObj.query.url +
      ':' + parsedObj.query.id);
    this.redis.exists('user:' + parsedObj.query.url +
        ':' + parsedObj.query.id)
      .then(result => {
        log.debug('user:' + parsedObj.query.url + ':' +
          parsedObj.query.id + (result ? ' key exists' :
            ' key does not exists'));
        return result ? this.keyExistsInActiveQ(parsedObj) :
          this.keyDoesNotExistsInActiveQ(parsedObj);
      })
      .then(result => {
        log.debug('handle result: ', result);
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

  keyExistsInActiveQ(parsedObj) {
    return new Promise((resolve, reject) => {
      this.redis.expire('user:' + parsedObj.query.url +
          ':' + parsedObj.query.id, ttl)
        .then(result => {
          log.debug('expire set result: ', result);
          resolve(result);
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
