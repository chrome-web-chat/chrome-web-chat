var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var mongoose = require('mongoose');
var mongodbUri = process.env.MONGODB_URI;
mongoose.connect(mongodbUri);
var Message = require('./models/message');

const CHAT_MESSAGE_ENENT = 'chat message';
const CHAT_HISTORY_ENENT = 'chat history';
const HISTORY_LIMIT = 10;

app.set('port', process.env.PORT || 3000);

io.on('connection', function(socket){
  var room = socket.handshake.query.url;
  var id = socket.handshake.query.id;
  if (!room || !id) {
    console.log('no room or id provided');
    return;
  }

  Message
    .find({url: room})
    .sort({'timestamp': -1})
    .limit(HISTORY_LIMIT)
    .exec(function(err, historyMessages) {
      socket.to(socket.id).emit(CHAT_HISTORY_ENENT, historyMessages);
    });

  socket.join(room);

  console.log('a user connected to ' + room);
  console.log('id: ' + id);
  socket.on('disconnect', function(){
    console.log('user disconnected from ' + room);
  });

  socket.on('chat message', function(obj){
    var message = new Message({
      uid: id,
      url: room,
      domain: room,
      username: obj.username,
      content: obj.content
    });

    message.save(function(err) {
      if (err) throw err;
      console.log('Message saved successfully!');
    });

    console.log('room: ' + room);
    console.log('name: ' + obj.username);
    console.log('message: ' + obj.content);
    socket.broadcast.to(room).emit(CHAT_MESSAGE_ENENT, obj);
  });
});

http.listen(app.get('port'), function(){
  console.log('listening on port ' + app.get('port'));
});