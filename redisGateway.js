const restify = require('restify');
const Redis = require('ioredis');
const loglevel = 'debug';
const Logger = require('bunyan');
const log = new Logger.createLogger({
  name: 'redisGateway',
  level: loglevel,
  serializers: {
    req: Logger.stdSerializers.req
  }
});

const redis = new Redis(6382, '192.168.0.103');

redis.on('connect', function() {
  log.debug('redis connect');
});

redis.on('ready', function() {
  log.debug('redis ready');
  redis.set('foo', 'bar');
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

function respond(req, res, next) {
  // Or using a promise if the last argument isn't a function
  redis.get('getTestKey')
    .then(result => {
      //log.debug(result);
      res.send('hello ' + result);
      next();
    })
    .catch(e => {
      log.error(e);
      res.send('hello error ' + e);
      next();
    });
}

const server = restify.createServer();
server.get('/hello/:name', respond);
//server.head('/hello/:name', respond);

server.listen(8082, function() {
  console.log('%s listening at %s', server.name, server.url);
});
