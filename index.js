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

const server = require('./lib/server');
const router = require('./lib/router');
const requestHandlers = require('./lib/requestHandlers');

const handle = {};
handle['/get'] = requestHandlers.get;
handle['/set'] = requestHandlers.set;
handle['/sortedset'] = requestHandlers.sortedset;

server.start(router.route, handle);
