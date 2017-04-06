/**
 * Author @nadir93
 * Date 2017.4.5
 */
'use strict';

const loglevel = 'info';
const Logger = require('bunyan');
const log = new Logger.createLogger({
  name: 'Promoter',
  level: loglevel,
  serializers: {
    req: Logger.stdSerializers.req
  }
});
const ttl = 100; //second
const testValue = '123';

class Promoter {
  constructor(redis) {
    this.redis = redis;
  }

  promote(parsedObj) {
    return new Promise((resolve, reject) => {
      this.redis.pipeline()
        .setex('active:' + parsedObj.query.url + ':' +
          parsedObj.query.id, ttl, testValue)
        .sadd('activeQ:' + parsedObj.query.url, parsedObj.query.id)
        .exec()
        .then(result => {
          //result:  [ [ null, 1 ], [ null, 1 ] ]
          log.debug('promote result: ', result);
          resolve({
            scenario: '#2'
          });
        })
        .catch(e => {
          log.error(e);
          reject(e);
        });
    });
  }
}

module.exports = Promoter;
