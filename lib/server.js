/**
 * Author @nadir93
 * Date 2017.4.2
 */
'use strict';

const http = require('http');
const url = require('url');

const loglevel = 'info';
const Logger = require('bunyan');
const log = new Logger.createLogger({
  name: 'server',
  level: loglevel,
  serializers: {
    req: Logger.stdSerializers.req
  }
});

const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

function start(route, handle) {

  if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running`);
    // Fork workers.
    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
      console.log(`worker ${worker.process.pid} died`);
    });
  } else {
    http.createServer(onRequest).listen(8888);
    log.info('Server has started.');

    function onRequest(req, res) {
      const pathname = url.parse(req.url).pathname;
      log.debug('Request for ' + pathname + ' received.');
      route(handle, pathname, req, res);
    }
  }
}

exports.start = start;
