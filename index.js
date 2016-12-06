var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var mongoose = require('mongoose');
var mongodbUri = process.env.MONGODB_URI;
mongoose.connect(mongodbUri);
var Message = require('./models/message');

const CHAT_MESSAGE_EVENT = 'chat message';
const CHAT_HISTORY_EVENT = 'chat history';
const USER_LIST_EVENT = 'user list';
const HISTORY_LIMIT = 10;

app.set('port', process.env.PORT || 3000);

var userList = {};

io.on('connection', function(socket){
  // remove query string, hash, and trailing slashes from url
  var room = socket.handshake.query.url.split(/[?#]/)[0].replace(/\/+$/, "");
  var uid = socket.handshake.query.uid;
  var email = socket.handshake.query.email;
  if (!room || !uid || !email) {
    console.log('no room or uid or email provided');
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
      io.to(socket.id).emit(CHAT_HISTORY_EVENT, historyMessages);
    });

  socket.join(room);

  if (!userList[room]) {
    userList[room] = {};
  }
  if (!userList[room][email]) {
    userList[room][email] = 0;
  }
  userList[room][email] += 1;
  io.to(room).emit(USER_LIST_EVENT, Object.keys(userList[room]));

  console.log(userList);
  console.log('a user connected to ' + room);
  console.log('uid: ' + uid);
  socket.on('disconnect', function(){
    console.log('user disconnected from ' + room);
    userList[room][email] -= 1;
    if (userList[room][email] == 0) {
      delete userList[room][email];
      io.to(room).emit(USER_LIST_EVENT, Object.keys(userList[room]));
    }
    if (Object.keys(userList[room]).length === 0) {
      delete userList[room];
    }
    console.log(userList);
  });

  socket.on('chat message', function(obj){
    var message = new Message({
      uid: uid,
      url: room,
      domain: room,
      username: obj.username || 'Anonymous',
      content: obj.content || ' '
    });

    message.save(function(err) {
      if (err) throw err;
      console.log('Message saved successfully!');
    });

    console.log('name: ' + obj.username);
    console.log('message: ' + obj.content);
    obj.uid = uid;
    socket.broadcast.to(room).emit(CHAT_MESSAGE_EVENT, obj);
  });
});

http.listen(app.get('port'), function(){
  console.log('listening on port ' + app.get('port'));
});