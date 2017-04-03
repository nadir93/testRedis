/**
 * Author @nadir93
 * Date 2017.4.2
 */
'use strict';

const loglevel = 'debug';
const Logger = require('bunyan');
const log = new Logger.createLogger({
  name: 'redisGateway3',
  level: loglevel,
  serializers: {
    req: Logger.stdSerializers.req
  }
});

const Redis = require('ioredis');
const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length;
const route = require('./lib/route');

const host = '192.168.0.103';
const port = 6382;

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
  // Workers can share any TCP connection
  // In this case it is an HTTP server
  http.createServer((req, res) => {
    req.on('error', function(err) {
      log.error(err);
      res.statusCode = 400;
      res.end();
    });

    res.on('error', function(err) {
      log.error(err);
    });

    route.execute(req, res, redis);

  }).listen(8000);

  console.log(`Worker ${process.pid} started`);
}
