/**
 * Author @nadir93
 * Date 2017.4.2
 */
'use strict';
const get = require('./get');
const post = require('./post');
const put = require('./put');
const del = require('./delete');

module.exports = {
  execute: function(req, res, redis) {
    if (req.method === 'GET') {
      get.execute(req, res, redis);
    } else if (req.method === 'POST') {
      post.execute(req, res, redis);
    } else if (req.method === 'DELETE') {
      del.execute(req, res, redis);
    } else if (req.method === 'PUT') {
      put.execute(req, res, redis);
    } else {
      res.statusCode = 404;
      res.end();
    }
  }
};
