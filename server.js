var express = require("express");
var app = express();

app.use(express.static('public')); 
app.get("/", function(req, res){
    res.sendFile( __dirname + "/" + "index.html");
});

var io = require('socket.io').listen(app.listen(process.env.PORT || 5000));

io.sockets.on('connection', function (socket) {
    socket.on('send', function (data) {
        console.log(socket.handshake.headers.host);
        io.sockets.emit('message', data);
    });
});
