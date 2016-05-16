var io;
var game;
var listofnames = ['Ellis', 'Arturo', 'Obdulia', 'Merry', 'Merna', 'Cherri', 'Daniela', 'Orlando', 'Renata', 'Barton', 'Yessenia', 'Alycia', 'Nigel', 'Kellie', 'Bonnie', 'Nga', 'Anisa', 'Jasper', 'Karla', 'Tai', 'Letitia', 'Chrissy', 'Kaci', 'Iris', 'Zelda', 'Blanch', 'Veda', 'Benedict', 'Daphine', 'Livia', 'Kacie', 'Collen', 'Colette', 'Elwood', 'Chan', 'Alaine', 'Treasa', 'Brianna', 'Jewell', 'Shiloh', 'Hettie', 'Art', 'Cami', 'Johnsie', 'Man', 'Rodrick', 'Verline', 'Harvey', 'Emilia', 'Rigoberto'];

var p_Game = require('./Game');
var util = require('./util');
var profiler = new util.Profiler();

var Game;
exports.initGameServer = function(_io){
		
	io = _io;
	
	
	Game = new p_Game.Game();
		
	io.sockets.on('connection', function(socket){
		var address = socket.handshake.address;
		address = address.split(":");
		address = address[address.length - 1];
		var randomGivenName = listofnames[ Math.round(Math.random() * (listofnames.length - 1)) ];
		console.log('New player joined: ' + randomGivenName + ": " + address);
		Game.AddNewPlayer(socket, randomGivenName);
		
		socket.on('disconnect', function(){
			console.log("Player: " + randomGivenName + ": " + address +  " Disconnected");
			// Game.RemovePlayer(socket);
		});
		
	});
	
	setInterval(mainLoop, 20);
	
}

var time = new Date().getTime();
function mainLoop(){
	var currTime = new Date().getTime();
	var elapsed = (currTime - time);
	
	// profiler.start("Update Game");
	// console.log(elapsed);
	Game.Update( elapsed /1000 );
	// profiler.end("Update Game");
	// profiler.log("Update Game");
	//profiler.reset("Update Game");
	
	
	time = currTime;

	debugLog(elapsed);
}


function debugLog(elapsed){
	
}
