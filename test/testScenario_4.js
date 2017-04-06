const loglevel = 'debug';
const Logger = require('bunyan');
const log = new Logger.createLogger({
  name: 'testSingle',
  level: loglevel,
  serializers: {
    req: Logger.stdSerializers.req
  }
});

const schedule = require('node-schedule');
let receivedMsgCnt = 0;
const j = schedule.scheduleJob('*/1 * * * * *', function() {
  log.info('초당처리량(TPS): ', receivedMsgCnt);
  //log.info('평균응답속도(ms): ', (responseTimeSum / receivedMsgCnt));
  receivedMsgCnt = 0;
  //responseTimeSum = 0;
});

const host = '127.0.0.1';
const port = 6379;
const Redis = require('ioredis');
const redis = new Redis(port, host);

redis.on('connect', function() {
  log.debug('redis connect');
});

redis.on('ready', function() {
  log.debug('redis ready');
  doAsync(getData, 5000000, 300, function(count) {
    log.debug('end count: ', count);
  });
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

function getData(cb) {
  // redis.get('getTestKey', function(err, result) {
  //   //log.debug(result);
  //   receivedMsgCnt++;
  //   cb();
  // });
  redis.exists('active:/test/url:user001')
    .then(result => {
      return redis.expire('active:/test/url:user001', 100);
    })
    .then(() => {
      receivedMsgCnt++;
      cb();
    })
    .catch(e => {
      log.error(e);
    });
}

function doAsync(fn, iterations, concurrency, next) {
  log.debug('start');
  var running = pending = iterations;

  function iterate() {
    if (!pending) {
      return next(iterations);
    }
    if (!running) {
      return;
    }
    --running;
    fn(function() {
      --pending;
      iterate();
    });
  }

  for (var i = 0; i < concurrency; ++i) {
    iterate();
  }
}
