var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.set('port', process.env.PORT || 3000);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){

  socket.join(socket.handshake.query.url);

  console.log('a user connected to ' + socket.handshake.query.url);
  socket.on('disconnect', function(){
    console.log('user disconnected from ' + socket.handshake.query.url);
  });
  socket.on('chat message', function(msg){
    console.log('room: ' + socket.handshake.query.url);
    console.log('message: ' + msg);
    io.to(socket.handshake.query.url).emit('chat message', msg);
  });
});

http.listen(app.get('port'), function(){
  console.log('listening on port ' + app.get('port'));
});