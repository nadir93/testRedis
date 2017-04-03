const loglevel = 'debug';
const Logger = require('bunyan');
const log = new Logger.createLogger({
  name: 'testRestHttp',
  level: loglevel,
  serializers: {
    req: Logger.stdSerializers.req
  }
});

const host = '192.168.0.101';
const port = 8083;
const redisHost = '192.168.0.103';
const redisPort = 6382;
const Redis = require('ioredis');
const payload = '012345678901234567890123456789012345678901234567' +
  '8901234567890123456789012345678901234567890123456789';

// const http = require('http');
//
// const server = http.createServer((req, res) => {
//   redis.get('getTestKey', function(err, result) {
//     // //log.debug(result);
//     // receivedMsgCnt++;
//     // cb();
//     res.statusCode = 200;
//     res.setHeader('Content-Type', 'text/plain');
//     res.end(result);
//   });
// });
//
// server.listen(port, host, () => {
//   console.log(`Server running at http://${host}:${port}/`);
// });
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
  http.createServer((req, res) => {
    //res.writeHead(200);
    //res.end('hello world\n');
    req.on('error', function(err) {
      log.error(err);
      res.statusCode = 400;
      res.end();
    });
    res.on('error', function(err) {
      log.error(err);
    });

    if (req.method === 'GET') {
      if (req.url === '/get') {
        redis.get('getTestKey', function(err, result) {
          //log.debug(result);
          // receivedMsgCnt++;
          // cb();
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/plain');
          res.end(result);
        });
      } else if (req.url === '/set') {
        redis.set('getTestKey', payload)
          .then(function(result) {
            //log.debug(result);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/plain');
            res.end(result);
          });
      } else {
        res.statusCode = 404;
        res.end();
      }
    } else if (req.method === 'POST') {

    } else if (req.method === 'DELETE') {

    } else {

    }
  }).listen(8000);

  console.log(`Worker ${process.pid} started`);
}
