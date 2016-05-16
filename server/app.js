var gameport = process.env.PORT || 4004;

var express = require('express');
var path = require('path');
var app = express();

var gameServer = require('./gameServer');

app.use(express.static(path.join(__dirname, '.')));


var server = require('http').createServer(app).listen( gameport );
var io = require('socket.io').listen(server);

gameServer.initGameServer(io);