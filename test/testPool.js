/**
 * Author @nadir93
 * Date 2017.4.1
 */
'use strict';
const Redis = require('ioredis');
const loglevel = 'debug';
const Logger = require('bunyan');
const log = new Logger.createLogger({
  name: 'testPool',
  level: loglevel,
  serializers: {
    req: Logger.stdSerializers.req
  }
});

const schedule = require('node-schedule');
const genericPool = require('generic-pool');
const payload = '012345678901234567890123456789012345678901234567' +
  '8901234567890123456789012345678901234567890123456789';
const host = '192.168.0.103';
const port = 6382;
let receivedMsgCnt = 0;

const j = schedule.scheduleJob('*/1 * * * * *', function() {
  log.info('초당처리량(TPS): ', receivedMsgCnt);
  //log.info('평균응답속도(ms): ', (responseTimeSum / receivedMsgCnt));
  receivedMsgCnt = 0;
  //responseTimeSum = 0;
});

/**
 * Step 1 - Create pool using a factory object
 */
const factory = {
  create: function() {
    return new Promise(function(resolve, reject) {
      let redis = new Redis(port, host);

      redis.on('connect', function() {
        log.debug('redis connect');
      });

      redis.on('ready', function() {
        log.debug('redis ready');
        resolve(redis);
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
    });
  },
  destroy: function(redis) {
    return new Promise(function(resolve) {
      redis.on('end', function() {
        log.debug('redis end');
        resolve();
      });
      redis.disconnect();
    });
  }
};

const opts = {
  max: 100, // maximum size of the pool
  min: 50 // minimum size of the pool
};

const redisPool = genericPool.createPool(factory, opts);

function execute(count) {
  if (count > 0) {
    const resourcePromise = redisPool.acquire();
    resourcePromise.then(function(redis) {
        // client.query('select * from foo', [], function() {
        //   // return object back to pool
        //   redisPool.release(client);
        // });
        redis.get('foo', function(err, result) {
          //log.debug(result);
          receivedMsgCnt++;
          redisPool.release(redis);
          execute(--count);
        });
      })
      .catch(function(err) {
        // handle error - this is generally a timeout or maxWaitingClients
        // error
        log.error(err);
      });
  }
}

execute(1000000);
execute(1000000);
execute(1000000);
execute(1000000);
execute(1000000);
execute(1000000);
execute(1000000);
execute(1000000);
execute(1000000);
execute(1000000);
execute(1000000);
execute(1000000);
execute(1000000);
execute(1000000);
execute(1000000);
execute(1000000);
execute(1000000);
execute(1000000);
execute(1000000);
execute(1000000);
execute(1000000);
execute(1000000);
execute(1000000);
execute(1000000);

execute(1000000);
execute(1000000);
execute(1000000);
execute(1000000);
execute(1000000);
execute(1000000);
execute(1000000);
execute(1000000);
execute(1000000);
execute(1000000);
execute(1000000);
execute(1000000);
execute(1000000);
execute(1000000);
execute(1000000);
execute(1000000);
execute(1000000);
execute(1000000);
execute(1000000);
execute(1000000);
execute(1000000);
execute(1000000);
execute(1000000);
execute(1000000);

// /**
//  * Step 2 - Use pool in your code to acquire/release resources
//  */
//
// // acquire connection - Promise is resolved
// // once a resource becomes available
// const resourcePromise = redisPool.acquire();
//
// resourcePromise.then(function(client) {
//     client.query('select * from foo', [], function() {
//       // return object back to pool
//       redisPool.release(client);
//     });
//   })
//   .catch(function(err) {
//     // handle error - this is generally a timeout or maxWaitingClients
//     // error
//   });
