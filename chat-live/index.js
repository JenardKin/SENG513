var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var moment = require('moment');
moment().format();

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
    console.log('a user connected');
    socket.on('disconnect', function(){
      console.log('user disconnected');
    });
    socket.on('chat message', function(msg){
        let msg_response = {msg: msg, ts:moment.utc().valueOf()}
        io.emit('chat message', msg_response);
    });
});

io.emit('some event', { for: 'everyone' });


http.listen(3000, function(){
  console.log('listening on *:3000');
});