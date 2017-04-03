const http = require('http');

const hostname = '192.168.0.101';
const port = 8083;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World\n');
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
// var cluster = require('cluster');
// var http = require('http');
// var os = require('os');
// var url = require('url');
//
// if (cluster.isMaster) {
//   for (var i = 0; i < os.cpus().length; i++) {
//     cluster.fork();
//   }
//
//   cluster.on('death', function(worker) {
//     console.error('worker %s died', worker.pid);
//   });
// }
//
// var server = http.createServer(function(req, res) {
//   var u = url.parse(req.url, true);
//   var data = JSON.stringify({
//     hello: u.query.name
//   });
//   res.writeHead(200, {
//     'content-type': 'application/json',
//     'content-length': data
//   });
//   res.end(data);
// });
//
// server.listen(8083);
