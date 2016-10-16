var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var messageSchema = new Schema({
  uid: { type: String, required: true},
  url: { type: String, required: true},
  domain: { type: String, required: true},
  username: { type: String, required: true},
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

var Message = mongoose.model('Message', messageSchema);

// make this available to our users in our Node applications
module.exports = Message;