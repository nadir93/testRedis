/**
 * Author @nadir93
 * Date 2017.4.2
 */
'use strict';

const loglevel = 'debug';
const Logger = require('bunyan');
const log = new Logger.createLogger({
  name: 'index',
  level: loglevel,
  serializers: {
    req: Logger.stdSerializers.req
  }
});
const Redis = require('ioredis');
const host = '127.0.0.1';
const port = 6379;
const server = require('./lib/server');
const router = require('./lib/router');
//const requestHandlers = require('./lib/requestHandlers');
const redis = new Redis(port, host);

redis.on('connect', function() {
  log.info('redis connect');
});

redis.on('ready', function() {
  log.info('redis ready');
});

redis.on('error', function(error) {
  log.error(error);
});

redis.on('close', function() {
  log.info('redis close');
});

redis.on('reconnecting', function(event) {
  log.info('reconnecting event: ', event);
});

redis.on('end', function() {
  log.info('redis end');
});

const handle = {};
//handle['/get'] = requestHandlers.get;
//handle['/set'] = requestHandlers.set;
//handle['/sortedset'] = requestHandlers.sortedset;
const Available = require('./lib/handler/Available');
handle['/available'] = new Available(redis);

server.start(router.route, handle);
