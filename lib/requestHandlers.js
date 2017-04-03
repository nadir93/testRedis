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

exports.get = get;
exports.set = set;
exports.sortedset = sortedset;
