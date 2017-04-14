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

const httpProxy = require('http-proxy');
const proxy = httpProxy.createProxyServer({});

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

        // You can define here your custom logic to handle the request
        // and then proxy the request.
        // proxy.web(req, res, { target: 'http://127.0.0.1:5060' });
        // 시나리오 #1, #2 일 경우 프락시로 실제 웹서비스 요청을 넘김

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
