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

const host = '192.168.0.101';
const port = 8083;
const redisHost = '192.168.0.103';
const redisPort = 6382;

const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length;

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
  const redis = new Redis(redisPort, redisHost);

  redis.on('connect', function() {
    log.debug('redis connect');
  });

  redis.on('ready', function() {
    log.debug('redis ready');
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
  // Workers can share any TCP connection
  // In this case it is an HTTP server
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
    log.debug('%s listening at %s', server.name, server.url);
  });

  console.log(`Worker ${process.pid} started`);
}
