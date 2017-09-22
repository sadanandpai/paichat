var express = require("express");
var app = express();

app.use(express.static('public')); 
app.get("/", function(req, res){
    res.sendFile( __dirname + "/" + "index.html");
});

var io = require('socket.io').listen(app.listen(process.env.PORT || 5000));
var counter = 0;

io.sockets.on('connection', function (socket) {
    socket.on('send', function (data) {
        data.host = socket.conn.remoteAddress;
        io.sockets.emit('message', data);
    });
});
