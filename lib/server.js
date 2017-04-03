/**
 * Author @nadir93
 * Date 2017.4.2
 */
'use strict';

const http = require('http');
const url = require('url');

const loglevel = 'debug';
const Logger = require('bunyan');
const log = new Logger.createLogger({
  name: 'server',
  level: loglevel,
  serializers: {
    req: Logger.stdSerializers.req
  }
});

const Redis = require('ioredis');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const host = '192.168.0.103';
const port = 6382;

function start(route, handle) {

  if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running`);
    // Fork workers.
    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
      console.log(`worker ${worker.process.pid} died`);
    });
  } else {
    const redis = new Redis(port, host);

    redis.on('connect', function() {
      log.debug('redis connect');
    });

    redis.on('ready', function() {
      log.debug('redis ready');
    });

    redis.on('error', function(error) {
      log.debug(error);
    });

    redis.on('close', function() {
      log.debug('redis close');
    });

    redis.on('reconnecting', function(event) {
      log.debug('reconnecting event: ', event);
    });

    redis.on('end', function() {
      log.debug('redis end');
    });

    http.createServer(onRequest).listen(8888);
    log.info('Server has started.');

    function onRequest(req, res) {
      const pathname = url.parse(req.url).pathname;
      //log.debug('Request for ' + pathname + ' received.');
      route(handle, pathname, req, res, redis);
    }
  }
}

exports.start = start;
