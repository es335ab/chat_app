
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var mongoose = require('mongoose');

//変更
var app = express();
//var app = module.exports = express.createServer();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
//追加
app.use(express.cookieParser());
app.use(express.session({ secret: 'your secret here' }));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

//ここを変更
//app.get('/', routes.index);
app.get('/', function(req, res) {
  res.render('index', { locals: { port: app.get('port') } });
});

app.get('/users', user.list);

//ここを変更
//http.createServer(app).listen(app.get('port'), function(){
//  console.log('Express server listening on port ' + app.get('port'));
//});
var server = http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

//mongoose
var Schema = mongoose.Schema;
var UserSchema = new Schema({
  message: String,
  date: Date
});
mongoose.model('User', UserSchema);
mongoose.connect('mongodb://localhost/chat_app');
var User = mongoose.model('User');

// ここからSocket.IO関連の処理
var io = require('socket.io').listen(server);
io.sockets.on('connection', function(socket) {

  //追加
  socket.on('msg update', function(){
    //接続したらDBのメッセージを表示
    User.find(function(err, docs){
      socket.emit('msg open', docs);
    });
  });

  console.log('connect');

  socket.on('msg send', function (msg) {
    socket.emit('msg push', msg);
    socket.broadcast.emit('msg push', msg);
    //DBに登録
    var user = new User();
    user.message  = msg;
    user.date = new Date();
    user.save(function(err) {
      if (err) { console.log(err); }
    });
  });

  //DBにあるメッセージを削除
  socket.on('deleteDB', function(){
    socket.emit('db drop');
    socket.broadcast.emit('db drop');
    User.find().remove();
  });

  socket.on('disconnect', function() {
    console.log('disconnect');
  });
});

//ここまでsocket.ioの処理

// ここ追加
console.log('Server running at http://localhost:' + app.get('port') + '/');







