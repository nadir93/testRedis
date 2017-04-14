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
        // 시나리오 #1, #2 일 경우 프락시로 실제 웹서비스 요청을 넘김
        log.debug('secenario: ', result[0]);
        (result[0] < 2) ? forward(req, res): response(res, result);
      })
      .catch(e => {
        log.error(e);
        res.statusCode = 500;
        res.end(e.message);
      });
  }
}

function forward(req, res) {
  proxy.web(req, res, {
    target: 'http://127.0.0.1:5060'
  });
}

function response(res, result) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(result));
}

proxy.on('error', function(err, req, res) {
  res.writeHead(500, {
    'Content-Type': 'text/plain'
  });

  res.end('Something went wrong. And we are reporting a custom error message.');
});

proxy.on('proxyRes', function(proxyRes, req, res) {
  log.debug('RAW Response from the target',
    JSON.stringify(proxyRes.headers, true, 2));
});

module.exports = Available;
