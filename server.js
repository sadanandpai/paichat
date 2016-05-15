var express = require("express");
var app = express();
var port = 3700;

app.use(express.static('public')); 
app.get("/", function(req, res){
    res.sendFile( __dirname + "/" + "index.html");
});

var io = require('socket.io').listen(app.listen(port));
console.log("Listening on port " + port);

io.sockets.on('connection', function (socket) {
    socket.on('send', function (data) {
        io.sockets.emit('message', data);
    });
});