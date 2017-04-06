const loglevel = 'info';
const Logger = require('bunyan');
const log = new Logger.createLogger({
  name: 'addItemToRedisSet',
  level: loglevel,
  serializers: {
    req: Logger.stdSerializers.req
  }
});

const host = '127.0.0.1';
const port = 6379;
const Redis = require('ioredis');
const redis = new Redis(port, host);

redis.on('connect', function() {
  log.info('redis connect');
});

redis.on('ready', function() {
  log.info('redis ready');
  addItemToRedisSet();
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

function addItemToRedisSet() {
  function add(count) {
    if (count > 0) {
      redis.sadd('activeQ:/test/url', Math.random())
        .then(result => {
          log.debug('sadd result: ', result);
          add(--count);
        })
        .catch(e => {
          log.error(e);
        });
    } else {
      process.exit();
    }

  };

  add(900000);
}
