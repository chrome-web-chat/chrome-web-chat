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
  var uid = socket.handshake.query.uid;
  if (!room || !uid) {
    console.log('no room or uid provuided');
    return;
  }

  Message
    .find({url: room})
    .sort({'timestamp': -1})
    .limit(HISTORY_LIMIT)
    .exec(function(err, historyMessages) {
      if (err) throw err;
      console.log('Sending the history...');
      console.log(historyMessages);
      io.to(socket.id).emit(CHAT_HISTORY_ENENT, historyMessages);
    });

  socket.join(room);

  console.log('a user connected to ' + room);
  console.log('uid: ' + uid);
  socket.on('disconnect', function(){
    console.log('user disconnected from ' + room);
  });

  socket.on('chat message', function(obj){
    var message = new Message({
      uid: uid,
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
    obj.uid = uid;
    socket.broadcast.to(room).emit(CHAT_MESSAGE_ENENT, obj);
  });
});

http.listen(app.get('port'), function(){
  console.log('listening on port ' + app.get('port'));
});