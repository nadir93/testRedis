/**
 * Author @nadir93
 * Date 2017.3.17
 */
'use strict';
const loglevel = 'error';

const Logger = require('bunyan');
const restify = require('restify');
const log = new Logger.createLogger({
  name: 'provisioning',
  level: loglevel,
  serializers: {
    req: Logger.stdSerializers.req
  }
});

const server = restify.createServer({
  name: 'provisioning',
  version: '0.1.0',
  log: log
});

const util = require('util');
const Redis = require('ioredis');
const redis = new Redis(6382, '192.168.0.103');

redis.on('connect', function() {
  log.debug('redis connect');
});

redis.on('ready', function() {
  redisAvailable = true;
  log.info('redis ready');
});

redis.on('error', function(error) {
  log.error('redis error: ', error);
});

redis.on('close', function() {
  log.debug('redis close');
});

redis.on('reconnecting', function(event) {
  log.info('reconnecting event: ', event);
});

redis.on('end', function() {
  redisAvailable = false;
  log.info('redis connection end');
});

let redisAvailable = false;

server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());

server.pre(function(request, response, next) {
  request.log.info({
    req: request
  }, 'REQUEST');
  next();
});

function respond(req, res, next) {
  res.send('hello ' + req.params.name);
  next();
}

server.get('/hello/:name', respond);

server.on('after', restify.auditLogger({
  log: Logger.createLogger({
    name: 'audit',
    level: loglevel,
    stream: process.stdout
  })
}));

server.on('uncaughtException', function(req, res, route, err) {
  var auditer = restify.auditLogger({
    log: log
  });
  auditer(req, res, route, err);
  res.send(500, 'Unexpected error occured');
});

server.listen(8083, function() {
  log.info('%s listening at %s', server.name, server.url);
});
