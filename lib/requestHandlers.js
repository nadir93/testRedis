/**
 * Author @nadir93
 * Date 2017.4.2
 */
'use strict';

const loglevel = 'debug';
const Logger = require('bunyan');
const log = new Logger.createLogger({
  name: 'requestHandlers',
  level: loglevel,
  serializers: {
    req: Logger.stdSerializers.req
  }
});

const url = require('url');
const id = 0;

function get(req, res, redis) {
  var parsedObj = url.parse(req.url, true);
  // {
  //   href: '/get?key=getTestKey',
  //   search: '?key=getTestKey',
  //   query: {
  //     key: 'getTestKey'
  //   },
  //   pathname: '/get'
  // }
  redis.get(parsedObj.query.key, function(err, result) {
    if (err) {
      res.statusCode = 404;
      res.end();
      return;
    }
    //log.debug('result: ', result);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end(result);
  });
}

function set(req, res, redis) {
  res.writeHead(200, {
    'Content-Type': 'text/html'
  });
  res.write('test');
  res.end();
}

function sortedset(req, res, redis) {
  res.writeHead(200, {
    'Content-Type': 'text/html'
  });
  res.write('test');
  res.end();
}

function available(req, res, redis) {
  var parsedObj = url.parse(req.url, true);
  log.debug('parsedObj: ', parsedObj);

  redis.pipeline()
    .exists('user:' + parsedObj.query.key + ':' + id)
    .expire('user:' + parsedObj.query.key + ':' + id, 10)
    .exec()
    .then(result => {
      //result:  [ [ null, 1 ], [ null, 1 ] ]
      log.debug('result: ', result);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/plain');
      res.end();
    })
    .catch(e => {
      log.error(e);
      res.statusCode = 500;
      res.end();
    });

  // redis.exists('user:' + parsedObj.query.key + ':' + id)
  //   .then(result => {
  //     log.debug('result: ', result);
  //     return result ? keyExists(parsedObj, redis) : KeyDoesNotExists();
  //   })
  //   .then(result => {
  //     log.debug('result: ', result);
  //     res.statusCode = 200;
  //     res.setHeader('Content-Type', 'text/plain');
  //     res.end();
  //   })
  //   .catch(e => {
  //     log.error(e);
  //     res.statusCode = 500;
  //     res.end();
  //   });
}

function keyExists(parsedObj, redis) {
  return new Promise(function(resolve, reject) {
    redis.expire('user:' + parsedObj.query.key +
        ':' + id, 10)
      .then((result) => {
        resolve(result);
      })
      .catch(e => {
        log.error(e);
        reject(e);
      });
  });
}

function KeyDoesNotExists() {
  return new Promise(function(resolve, reject) {
    resolve(0);
  });
}

exports.get = get;
exports.set = set;
exports.sortedset = sortedset;
exports.available = available;
