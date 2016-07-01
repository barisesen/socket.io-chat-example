var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// Veritabanı için bağlantılar
var Sequelize = require('sequelize');
var sequelize = new Sequelize('chat', 'root', 'root');

// Chat tablosu oluştur.
var Chat      = sequelize.define('Chat', {
  user_name   : Sequelize.STRING,
  socket_id   : Sequelize.STRING
});

var Room      = sequelize.define('Room',{
  title       : {type : Sequelize.STRING ,unique: true}
});

var counter=0;

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  socket.on('chat message', function(msg){

    Chat.findOne({ where: {socket_id: socket.id} }).then(function(user) {
      // io.emit('chat message', user.user_name+" ---> "+msg);
        console.log(socket.room);
        console.log(msg);
        // socket oda sına mesajı emit et.
        io.to(socket.room).emit('chat message', user.user_name+" ---------> "+msg);
    });

  });

  // users socketine bir emit olursa burası çalışır ve
  // Kullanıcıyı veritabanına kaıt eder
  // Kullanıcıyı kullanıcının verdiği oda ismine join eder
  socket.on('users',function(name,oda){

    // Oda daha önce açılmamış ise oda oluştur.
    Room.findOne({ where: {title: oda} }).then(function(odaTitle) {
      if(!odaTitle)
      {
        sequelize.sync().then(function() {
          return Room.create({
            title : oda
          });
        }).then(function(test) {
          console.log(test.get({
            plain: true
          }));
        });
      }else {
        console.log("oda açıktı join oldu");
      }
    });

    socket.room = oda;
    console.log(socket.room);

    socket.name = name;
    console.log(name);

    // Odaya katıl.
    socket.join(oda);

    // console.log(io.sockets.adapter);
    // var odalar = io.sockets.adapter.rooms[oda];
    // console.log(odalar);
    // console.log(odalar.length);

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

  });


  // Broadcast kullandıgında kendine gelmez odadaki diger kişilere gidecektir.
  socket.on('yaziyor',function(name,oda,uzunluk){
    if(uzunluk > 0)
    {
      socket.broadcast.to(oda).emit('yaziyor',name+' birşeyler söyleyecek gibi :)');
    }else {
      socket.broadcast.to(oda).emit('yaziyor','');

    }
  });

// kullanıcı cıkıs yaptıgında buraya emit edilecek
// buradan kımın cıkıs yaptıgını socket ıd sayesinde veritabanından çekebiliriz.
  socket.on('disconnect', function () {
    Chat.findOne({ where: {socket_id: socket.id} }).then(function(user) {
      // socket id si ile eşlesen user ı getir
      io.emit('users', user.user_name+" ---> Disconnected");
      console.log('user disconnected '+user.user_name);
      user.destroy();
    });
      counter--;
      console.log(counter);
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
