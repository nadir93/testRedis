const loglevel = 'info';
const Logger = require('bunyan');
const log = new Logger.createLogger({
  name: 'testScenario_3',
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
  init()
    .then(() => {
      //doAsync(getData, 1, 1, function(count) { // run once
      doAsync(getData, 5000000, 300, function(count) {
        log.info('loop end count: ', count);
        j.cancel();
        release()
          .then(() => {
            process.exit();
          });
      });
    })
    .catch(e => {
      log.error(e);
    });
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

function init() {
  return new Promise((resolve, reject) => {
    redis.pipeline()
      .set('waiting:/test/url:user001', '123')
      //.sadd('activeQ:/test/url', 'user001')
      .zadd('waitingQ:/test/url', '123', 'user001')
      .exec()
      .then(result => {
        log.info('init result: ', result);
        resolve();
      })
      .catch(e => {
        log.error(e);
        reject();
      });
  });
}

function release() {
  return new Promise((resolve, reject) => {
    redis.pipeline()
      .del('waiting:/test/url:user001')
      .del('activeQ:/test/url')
      .del('waitingQ:/test/url')
      .del('active:/test/url:user001')
      .exec()
      .then(result => {
        log.info('release result: ', result);
        resolve();
      })
      .catch(e => {
        log.error(e);
        reject();
      });
  });
}

function getData(cb) {
  redis.check_waiting('active:/test/url:user001', 'activeQ:/test/url',
      'waitingQ:/test/url', 'waiting:/test/url:user001',
      0 /*maxActiveCount*/ , 'user001', 10 /* expireTime */ , 123 /*userContent*/ )
    .then(result => {
      log.debug('result: ', result);
      receivedMsgCnt++;
      cb();
    })
    .catch(e => {
      log.error(e);
    });
}

function doAsync(fn, iterations, concurrency, next) {
  log.debug('loop start');
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
