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

class Available extends AbstractHandler {

  constructor(redis) {
    super();
    this.waitingManager = new WaitingManager(redis);
    this.redis = redis;
  }

  handle(req, res) {
    const parsedObj = url.parse(req.url, true);
    log.debug('parsedObj: ', parsedObj);

    this.waitingManager.enqueue(parsedObj)
      .then(result => {
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
}

module.exports = Available;
