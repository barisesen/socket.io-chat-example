var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var Sequelize = require('sequelize');
var sequelize = new Sequelize('chat', 'root', 'root');

var Chat = sequelize.define('Chat', {
  user_name   : Sequelize.STRING,
  socket_id   : Sequelize.STRING
});

var counter=0;


app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  socket.on('chat message', function(msg){

    Chat.findOne({ where: {socket_id: socket.id} }).then(function(user) {
      // project will be the first entry of the Projects table with the title 'aProject' || null
      io.emit('chat message', user.user_name+" ---> "+msg);

    });
  });

  socket.on('disconnect', function () {
    Chat.findOne({ where: {socket_id: socket.id} }).then(function(user) {
      // socket id si ile eşlesen user ı getir
      io.emit('users', user.user_name+" ---> Disconnected");
      console.log('user disconnected '+user.user_name);

    });
  //  io.emit('users','user disconnected '+socket.id);
    //  console.log('user disconnected '+ socket.id);
      counter--;
      console.log(counter);
    });


    socket.on('users',function(name){
      io.emit('users',name+' connected '+socket.id);


       // giriş yapan kullanıcı ıcın verıtabanına kayıt acıyoruz.
        sequelize.sync().then(function() {
          return Chat.create({
            user_name  : name,
            socket_id  : socket.id
          });
        }).then(function(test) {
          // console.log(test.get({
          //   plain: true
          // }));
        });

      console.log(name);
    });

});


io.on('connect',function() {
 console.log('dummy user connected');


  counter++;
  console.log(counter);

});



http.listen(3000, function(){
  console.log('listening on *:3000');

});
