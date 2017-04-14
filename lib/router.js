/**
 * Author @nadir93
 * Date 2017.4.2
 */
'use strict';

const loglevel = 'info';
const Logger = require('bunyan');
const log = new Logger.createLogger({
  name: 'router',
  level: loglevel,
  serializers: {
    req: Logger.stdSerializers.req
  }
});

const httpProxy = require('http-proxy');
const proxy = httpProxy.createProxyServer({});

function route(handle, pathname, req, res) {
  log.debug('About to route a request for ' + pathname);
  log.debug('type: ', typeof handle[pathname]);

  // static or dynamic 으로 filtering을 하여
  // 해당 url요청에 가상 waiting을 적용
  if (typeof handle[pathname] === 'object') {
    handle[pathname].handle(req, res);
  } else {
    //나머지는 원래 서비스로 흘려보냄
    proxy.web(req, res, {
      target: 'http://127.0.0.1:5060'
    });
  }
}

exports.route = route;
