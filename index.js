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

redis.defineCommand('check_waiting', {
  numberOfKeys: 4,
  lua: 'if redis.call("exists", KEYS[1]) == 1 then ' +
    '     return {1, redis.call("expire", KEYS[1], ARGV[3])} ' + //scenario #1
    '   else ' +
    '     local activeq_size = redis.call("scard", KEYS[2]) ' +
    '     local waitingq_size = redis.call("zcard", KEYS[3]) ' +
    '     if activeq_size < tonumber(ARGV[1]) and waitingq_size < 1 then ' +
    '       return {2, redis.call("setex", KEYS[1], ARGV[3], ARGV[4]), ' + //scenario #2
    '                redis.call("sadd", KEYS[2], ARGV[2])} ' +
    '     else ' +
    '       if redis.call("exists", KEYS[4]) == 1 then ' +
    '         return {3, redis.call("expire", KEYS[4], ARGV[3]), ' + //scenario #3
    '                  redis.call("zrank", KEYS[3], ARGV[2]), waitingq_size} ' +
    '       else ' +
    '         return {4, redis.call("setex", KEYS[4], ARGV[3], ARGV[4]), ' + // scenario #4
    '                 redis.call("zadd", KEYS[3], 2000000000 - redis.call("ttl", "future"), ARGV[2]), ' +
    '                 waitingq_size + 1, ' +
    '                 waitingq_size + 1} ' +
    '       end ' +
    '     end ' +
    '   end '
});

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
handle['/test/url'] = new(require('./lib/handler/Available'))(redis);

server.start(router.route, handle);
