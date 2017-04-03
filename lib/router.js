/**
 * Author @nadir93
 * Date 2017.4.2
 */
'use strict';

const loglevel = 'debug';
const Logger = require('bunyan');
const log = new Logger.createLogger({
  name: 'router',
  level: loglevel,
  serializers: {
    req: Logger.stdSerializers.req
  }
});

function route(handle, pathname, req, res, redis) {
  //log.debug('About to route a request for ' + pathname);
  if (typeof handle[pathname] === 'function') {
    handle[pathname](req, res, redis);
  } else {
    log.debug('No request handler found for ' + pathname);
    res.writeHead(404, {
      'Content-Type': 'text/html'
    });
    res.write('404 Not found');
    res.end();
  }
}

exports.route = route;
