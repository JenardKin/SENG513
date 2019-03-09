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
const PORT = process.env.PORT || 3000;
const moment = require('moment');
const moment_tz = require('moment-timezone');
const cool = require('cool-ascii-faces');

const rug = require('random-username-generator');
const cookieParser = require('cookie-parser');

var colors = [];

  for(let i = 0; i < 500; i++){
    let c = getRandomColor();
    if(!colors.includes(c))
      colors.push(c);
  }

var chatHistory = []; // store chat history in memory

var chatUsers = []; // to keep track of the current users nickname and their time that they joined the chat

moment().format();
moment_tz().format();

app.use(cookieParser());

app.get('/', function(req, res){
  if(!req.cookies.nickname){

    // set a new cookie that will last 1 hr
    res.cookie("nickname", rug.generate());
  
  }
  
  res.sendFile(__dirname + '/index.html');
});

app.get('/cool', (req,res) => res.send(cool()));

app.get('/changeNickname', (req, res) => {
  res.cookie('nickname', req.query['nickname']);
  res.redirect('back');
});

app.get('/changeColor', (req, res) => {
  res.cookie('hexcolor', req.query['hexcolor']);
  res.redirect('back');
});

io.on('connection', function(socket){

  let nickname = read_cookie('nickname', socket.handshake.headers['cookie']);

  let userAlreadyConnected = false;
  chatUsers.forEach(function(user){
    if(user == nickname){
      userAlreadyConnected = true;      
    }
  })

  socket.emit('colors', colors)

  if(userAlreadyConnected)
    console.log('user:', nickname, ' already has logged in.');
  else{
    console.log('a user connected, nickname:', nickname);
    chatUsers.push(nickname);
  }
  io.emit('user connect', JSON.stringify(chatUsers));

  // Send the chat history to the user connecting
  if(chatHistory.length > 0){
    socket.emit('chat history', JSON.stringify(chatHistory));
  }

  socket.on('disconnect', function(){
    nickname = read_cookie('nickname', socket.handshake.headers['cookie']);

    console.log('user disconnected, nickname:', nickname);

    chatUsers = chatUsers.filter(function(user){
      return user != nickname;
    });

    io.emit('user connect', JSON.stringify(chatUsers));

    io.emit('refresh users', "");

  });

  socket.on('chat message', function(msg){

    nickname = read_cookie('nickname', socket.handshake.headers['cookie']);
    let split = msg.split(/(\S+\s+)/).filter(function(n) {return n});

    if(split[0] === '/nick '){
      if(split.length != 2){
        socket.emit('alert', 'Please ensure there are no spaces in the nickname.\n(Format: /nick <new nickname>)');
      }
      else{
        // delete the user
        chatUsers = chatUsers.filter(function(user){
          return user != nickname;
        });

        chatHistory.forEach(function (message, index){
          if(message['nickname'] == nickname){
            message['nickname'] = split[1];
          }
        });

        // Send the chat history to the user connecting
        if(chatHistory.length > 0){
          io.emit('chat history', JSON.stringify(chatHistory));
        }
        
        socket.emit('redirect', '/changeNickname?nickname=' + split[1]);
      }
    }
    else if(split[0] === '/nickcolor '){
      if(split.length != 2){
        socket.emit('alert', 'Please ensure you have the correct format to change colors.\n(Format: /nickcolor RRGGBB)');
      }
      else if(is_hexadecimal(split[1])){
        socket.emit('redirect', '/changeColor?hexcolor=' + split[1]);
      }
      else{
        socket.emit('alert', 'Please ensure you input a valid hex color.\n(Format: /nickcolor RRGGBB)');
      }
    }
    else if(msg.substring(0, 1) === '/'){
      socket.emit('alert', 'Invalid command. Do you mean either:\n /nick <new nickname> or /nickcolor RRGGBB?');
    }
    else{
      let msg_response = {msg: msg, ts: moment.utc().valueOf(), nickname: read_cookie('nickname', socket.handshake.headers['cookie'])}
      chatHistory.push(msg_response);
      io.emit('chat message', msg_response);
    }
  });

  socket.on('refresh users', function(nickname){
    if(!chatUsers.includes(nickname)){
      chatUsers.push(nickname);
      io.emit('user connect', JSON.stringify(chatUsers));
    }
  });

});


http.listen(PORT, function(){
  console.log(`Listening on ${ PORT }`);
});

// Get the object variable from cookie based on the name
function read_cookie(name_of_key, cookie) {

  if(typeof(cookie) == 'undefined')
    return '';
  
  let cookie_array_key_value = cookie.split('; ');
  let return_val = ''; // return null if not found

  cookie_array_key_value.forEach(function(item, index){
    let key = item.split('=')[0];
    let value = item.split('=')[1];
    if(key == name_of_key){
      return_val = value;
    }
  });

  return return_val;        
}

function is_hexadecimal(str)
{
 regexp = /^[0-9a-fA-F]+$/;
  
        if (regexp.test(str))
          {
            return true;
          }
        else
          {
            return false;
          }
}

// Random HexColor generator
function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}
