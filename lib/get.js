/**
 * Author @nadir93
 * Date 2017.4.2
 */
'use strict';

module.exports = {
  execute: function(req, res, redis) {
    redis.get(req.url, function(err, result) {
      if (err) {
        res.statusCode = 404;
        res.end();
        return;
      }
      //log.debug(result);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/plain');
      res.end(result);
    });
  }
};
