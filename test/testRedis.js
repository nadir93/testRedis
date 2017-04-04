/**
 * Author @nadir93
 * Date 2017.3.17
 */
'use strict';
const restify = require('restify');
const Redis = require('ioredis');
const loglevel = 'debug';
const Logger = require('bunyan');
const log = new Logger.createLogger({
  name: 'testRedis',
  level: loglevel,
  serializers: {
    req: Logger.stdSerializers.req
  }
});
const schedule = require('node-schedule');

let receivedMsgCnt = 0;
let responseTimeSum = 0;
const loopCount = 100000;
const clientCount = 1;
const host = '127.0.0.1';
const port = 32770;
const payload = '012345678901234567890123456789012345678901234567' +
  '8901234567890123456789012345678901234567890123456789';

const j = schedule.scheduleJob('*/1 * * * * *', function() {
  log.info('초당처리량(TPS): ', receivedMsgCnt);
  //log.info('평균응답속도(ms): ', (responseTimeSum / receivedMsgCnt));
  receivedMsgCnt = 0;
  //responseTimeSum = 0;
});

function main(clientCnt) {
  return new Promise((resolve, reject) => {
    function next(index) {
      if (index < 1) {
        resolve();
      } else {
        initRedisClient()
          .then(res => {
            //log.debug('start: ', new Date().getTime());
            res.getLoop(loopCount);
            next(--index);
          })
          .catch(e => {
            log.error(e);
            reject(e);
          });
      }
    }
    next(clientCnt);
  });
}

main(clientCount)
  .then(() => {
    log.debug('init done');
  })
  .catch(e => {
    log.error(e);
  });

function initRedisClient() {
  return new Promise((resolve, reject) => {
    let redis = new Redis(port, host);

    redis.on('connect', function() {
      log.debug('redis connect');
    });

    redis.on('ready', function() {
      redis.set('getTestKey', payload);
      log.debug('redis ready');
      //let start = new Date().getTime();
      //let stop;
      resolve({
        redis: redis,
        getLoop: function(index) {
          if (index < 1) {
            //log.debug('loop end');
            return;
          }

          //start = new Date().getTime();
          redis.get('getTestKey')
            .then(result => {
              //stop = new Date().getTime();
              //responseTimeSum += (stop - start);
              //log.debug(result);
              receivedMsgCnt++;
              this.getLoop(--index);
            })
            .catch(e => {
              log.error(e);
            });
        }
      });
    });

    redis.on('error', function(error) {
      log.debug(error);
    });

    redis.on('close', function() {
      log.debug('redis close');
    });

    redis.on('reconnecting', function(event) {
      log.debug('reconnecting event=' + event);
    });

    redis.on('end', function() {
      log.debug('redis end');
    });
  });

}
