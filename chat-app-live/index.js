/*
Default index.js from tutorial

const cool = require('cool-ascii-faces')
const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000

express()
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .get('/cool', (req,res) => res.send(cool()))
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))
*/

const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const PORT = 3000;
const moment = require('moment');
const cool = require('cool-ascii-faces');
moment().format();

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.get('/cool', (req,res) => res.send(cool()))

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


http.listen(PORT, function(){
  console.log(`Listening on ${ PORT }`);
});