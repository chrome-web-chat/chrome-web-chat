var app = require('express')();
var http = require('http').Server(app);
var ejs = require('ejs');
var fs = require('fs');
var io = require('socket.io')(http);

app.set('port', process.env.PORT || 3000);
const SERVER = process.env.SERVER_URL || 'localhost:' + app.get('port');

app.get('/', function(req, res){
  res.writeHead(200, {'Content-Type': 'text/html'});
  fs.readFile('index.html', 'utf-8', function(err, content) {
    if (err) {
      res.end('error occurred');
      return;
    }
    var html = ejs.render(content, {server: SERVER});
    res.end(html);
  });
});

io.on('connection', function(socket){
  var room = socket.handshake.query.url;
  socket.join(room);

  console.log('a user connected to ' + room);
  socket.on('disconnect', function(){
    console.log('user disconnected from ' + room);
  });

  socket.on('chat message', function(obj){
    console.log('room: ' + room);
    console.log('name: ' + obj.name);
    console.log('message: ' + obj.msg);
    socket.broadcast.to(room).emit('chat message', obj);
  });
});

http.listen(app.get('port'), function(){
  console.log('listening on port ' + app.get('port'));
});