/**
 * Author @nadir93
 * Date 2017.4.2
 */
'use strict';

module.exports = {
  execute: function(req, res, redis) {
    var jsonData = '';
    req.on('data', function(chunk) {
      jsonData += chunk;
    });
    req.on('end', function() {
      var reqObj = JSON.parse(jsonData);
      var resObj = {
        message: 'Hello ' + reqObj.name,
        question: 'Are you a good ' + reqObj.occupation + '?'
      };
      res.writeHead(200);
      res.end(JSON.stringify(resObj));
    });

    // if (req.url === '/set') {
    //   redis.set('getTestKey', payload)
    //     .then(function(result) {
    //       //log.debug(result);
    //       res.statusCode = 200;
    //       res.setHeader('Content-Type', 'text/plain');
    //       res.end(result);
    //     });
    // } else {
    //   res.statusCode = 404;
    //   res.end();
    // }
  }
};
