

var p_Objects = require('./gameObject');
var p_World = require('./World.js');
var p_EventHandler = require('./EventHandler.js');
var sha1 = require('sha1');
var util = require('./util');
var profiler = new util.Profiler();
var EventEmitter = require('events');
var request = require('sync-request');

function Player(socket, name, gameObject){
	this.socket = socket;
	this.name = name;
	this.gameObject = gameObject;
	this.id = null;
	
	this.GenerateId = function(){
		this.id = sha1(new Date().getTime() + '' + Math.round(Math.random()*10));
	};
	this.BindControls = function(){
		var _that = this;
		
		// console.log("binding: ", _that.gameObject.properties.id);
		this.socket.on('move', function( input ){
			var direction = input;
			
			// console.log(_that.gameObject.properties.id);
			_that.gameObject.RequestMovement( direction );
		});
		this.socket.on('stop', function(){
			_that.gameObject.RequestNoMovement();
		});
		
		this.socket.on('attack', function(){
			_that.gameObject.RequestAttack();
		});
	};
	this.UpdatePlayer = function( world ){
		/* Determine what in the world that should be sent to the players GUI */
		var pos = this.gameObject.properties.position;
		var sight = this.gameObject.properties.sight;
		
		// profiler.start("GetStaticObjectsBoxProperties");
		var staticObjects = world.GetStaticObjectsBoxProperties(pos.x - (sight + 1), pos.y - (sight + 1 ), (sight+1) * 2, (sight+1) * 2);
		// profiler.end("GetStaticObjectsBoxProperties");
		
		// profiler.start("GetDynamicObjectsBoxProperties");
		var dynamicObjects = world.GetDynamicObjectsBoxProperties(pos.x - (sight + 1), pos.y - (sight + 1 ), (sight+1) * 2, (sight+1) * 2);
		// profiler.end("GetDynamicObjectsBoxProperties");
		
		
		var HUDinfo = {
			focus : this.gameObject.properties,
			name : this.name
		}
		
		var response = JSON.stringify({
			s: staticObjects,
			d: dynamicObjects,
			h: HUDinfo
		});
		
		
		// console.log(staticObjects);
		// profiler.start("Socket emit");
		this.socket.emit('update', response);
		// profiler.end("Socket emit");
		
	};
	this.GenerateId();
	this.BindControls();
}


function Game(){
	this.gameSpeed = 1;
	// this.updatesPerPaint = 2;
	this.updateCounters = 0;
	this.map = [[]];
	this.mapResolution = 0.01;
	this.objects = {
		collisonableObjects : []
	};
	this.players = {};
	// this.players = new EventEmitter();
	
	// this.view = new View();
	this.world = new p_World.World();
	this.eventHandler = new p_EventHandler.EventHandler();
	
	this.Construct = function(){
		// this.LoadDummyLevel();
		this.LoadLevel("level0");
	};
	
	this.AddNewPlayer = function( socket, name ){
		
		var hero;
		if( Math.random()*8 <= 4 ) {
			console.log(name + " has been reincarnated as Paran");
			hero = new p_Objects.ParanHero({x:5 * Math.random()*5, y:5*Math.random()*5}, {x:0,y:0}, name);
		} else {
			console.log(name + " has been reincarnated as Faran");
			hero = new p_Objects.FaranHero({x:5 * Math.random()*5, y:5*Math.random()*5}, {x:0,y:0}, name);
		}
		
		
		
		hero.SetEventHandler( this.eventHandler );
		this.world.AddDynamicObject( hero );
		
		var player = new Player(socket, name, hero);
		this.players[player.id] = player;	// should be a player list object that does cleanup
		// this.players.on("update", (world) => {
			
				// player.UpdatePlayer( world );
		
		// });
		
		
		// for(var i in this.players){
			// console.log( this.players[i].gameObject.properties.id );
			// // console.log( this.players[i].id );
		// }
		
		// console.log("-------------------------------------------");
		// socket.on('disconnect', function(){
			// this.players[player.id]
			
		// });
		
	};
	
	this.RemovePlayer = function( socket ){
		// var list = this.players;
		for( var p in this.players ){
			// console.log(this.players[p].socket.id , socket.id);
			if(this.players[p].socket.id == socket.id){
				this.world.RemoveDynamicObject( this.players[p].gameObject );
				delete this.players[p];
			}
		}
	};
		
	this.LoadDummyLevel = function(){
		var map = [];
		for(var y = 0; y < 30; y++){
			for(var x = 0; x < 30; x++){
				if( map[y] == undefined ) {
					map[y] = [];
					if( map[y][x] == undefined ) {
						map[y][x] = [];
					}
				}
				if( x == 4 && y > 5 && y < 9){
					map[y][x] = new p_Objects.MapObject( p_Objects.ObjectType.WALL, {x:x, y:y} );
				}else if( x == 10 && y > 8 && y < 15){
					map[y][x] = new p_Objects.MapObject( p_Objects.ObjectType.WALL, {x:x, y:y} );
				}else if( x > 3 && x < 13 && y == 20 ){
					map[y][x] = new p_Objects.MapObject( p_Objects.ObjectType.WALL, {x:x, y:y} );
				} else if( x == 4 && y == 5 ){
					map[y][x] = new p_Objects.MapObject( p_Objects.ObjectType.WALL, {x:x, y:y} );
				} else {
					map[y][x] = new p_Objects.MapObject( p_Objects.ObjectType.FLOOR, {x:x, y:y} );
				}
			}
		}
		this.world.SetStaticObjects( map );
		console.log("Dummy map generated: " + map.length +" x "+ map[0].length);
	};
	this.LoadLevel = function(levelname){
		
		// var rawMap = eval("(" + $.ajax({
			// url: "server/levelManager.php",
			// type: 'POST',
			// async: false,
			// dataType: 'JSON'
		// }).responseText + ")");
				
		
		var rawMap = eval("(" + request('POST', 'http://www.brandvik.se/labyrintFighters/server/levelManager.php', {
			json: { levelname: levelname }
		}).body + ")");
		
		var map = [];
		for(var y in rawMap){
			for(var x in rawMap[y]){
				if( map[y] == undefined ) {
					map[y] = [];
					if( map[y][x] == undefined ) {
						map[y][x] = [];
					}
				}
				if( rawMap[y][x] == 0 ){
					var posibilities = {l:true, t: true, r: true, b: true};
				
					if( y > 0 ){
						if( y == rawMap.length - 1) posibilities.b = false;
						if( rawMap[y-1][x] != 0) posibilities.t = false;						
						
					} else {
						posibilities.t = false;
						
					}
					if( y < rawMap.length - 1) {
						if( rawMap[(y-0)+1][x] != 0) posibilities.b = false;
					}
					
					if( x > 0 ){
						if( x == rawMap[y].length - 1) posibilities.r = false;
						if( rawMap[y][x-1] != 0) posibilities.l = false;

					} else {
						posibilities.l = false;

					}
					if( x < rawMap[y].length - 1) {
						if( rawMap[y][(x-0)+1] != 0) posibilities.r = false;
					}
					
					
					var folder = "walls/";
					var img = "stub.png";
					if(posibilities.l || posibilities.t || posibilities.r || posibilities.b){
						if(posibilities.l && posibilities.t && posibilities.r && posibilities.b){
							img = "ltrb.png";
						} else {
							var str = "";
							for(var p in posibilities){
								if( posibilities[p]){
									str += p;
								}
							}
							img = str + ".png";
						}
					}
					var path = folder + img;			
				
					map[y][x] = new p_Objects.MapObject( p_Objects.ObjectType.WALL, {x:x, y:y}, {x: 0, y:0}, path );
				} else {
					map[y][x] = null; //new p_Objects.MapObject( p_Objects.ObjectType.FLOOR, {x:x, y:y}, {x: 0, y:0} );
				}
				
				
				if( rawMap[y][x] == 128 ){
					var point = new p_Objects.PointObject({x:x, y:y});
					point.SetEventHandler( this.eventHandler );
					this.world.AddDynamicObject( point );
				}
			}
		}
		
		this.world.SetStaticObjects( map );
		
		var dim = this.world.GetDimensions();
		// console.log(dim);
		// this.view.SetResolution(dim.w, dim.h);
	};
	this.GetDimensions = function(){
		return {w: this.map[0].length, h: this.map.length};
	};
	
	this.InitiateHero = function(){
		var hero = new p_Objects.HeroObject({x:25, y:20}, {x:0,y:0});
		hero.SetEventHandler( this.eventHandler );
		this.world.AddDynamicObject( hero );
	};
	
	this.Update = function( deltaT ){
		/* Update every objects desire */
		// profiler.start("Update World");
		this.world.Update( deltaT );
		// profiler.end("Update World");
		// profiler.log("Update World");

		
		/* Check for collisions and launch events */
		
		// profiler.start("Update EventHandler");
		this.eventHandler.Update( this.world );
		// profiler.end("Update EventHandler");
		// profiler.log("Update EventHandler");
		
		
		// this.players.emit("update", this.world);
		for( var p in this.players ){
			// profiler.start("Update " + this.players[p].name);
			this.players[p].UpdatePlayer( this.world );
			// profiler.end("Update " + this.players[p].name);
			// profiler.log("Update " + this.players[p].name);
		}
		// profiler.log("GetStaticObjectsBoxProperties");
		// profiler.log("GetDynamicObjectsBoxProperties");
		// profiler.log("Socket emit");
		// profiler.reset("Socket emit");
		
		if( this.updateCounters % this.updatesPerPaint == 0 ){
			this.world.Animate();
			
			/* Not required on the server */
			// this.view.Repaint( this.world );
		}
		this.updateCounters++;
	};
		
	this.Construct();
}



/* The View is unnecessary on the server */
function View(){
	this.resolution = {x:1, y:1};
	this.SetResolution = function(height, width){
		this.resolution.x = document.getElementById("mainFrame").getAttribute("width") / height;//map.length;
		this.resolution.y = document.getElementById("mainFrame").getAttribute("height") / width;//map[0].length;
		// console.log(this.resolution.x, this.resolution.y);
	};
	
	this.Repaint = function( world ){
		// console.log( world );
		var c = document.getElementById("mainFrame");
		var ctx = c.getContext("2d");
		var map = world.staticObjects;
		
		
		ctx.fillStyle = "#FFFFFF";
		ctx.fillRect(0, 0, c.getAttribute("width"), c.getAttribute("height"));
		
		ctx.strokeStyle = "#BBBBBB";
		
		ctx.beginPath();
		for(var i = 0; i < map[0].length; i++){
			ctx.moveTo(i * this.resolution.x, 0);
			ctx.lineTo(i * this.resolution.x, map[i].length * this.resolution.y);
		}
		for(var i = 0; i < map.length; i++){
			ctx.moveTo(0, i * this.resolution.y);
			ctx.lineTo(map[i].length * this.resolution.x, i * this.resolution.y);
		}
		ctx.stroke();
		

		ctx.fillStyle = "#000000";
		

		for(var y in map){
			for(var x in map[y]){
				// console.log( map[y][x] );
				if( map[y][x].properties.type == ObjectType.WALL ){
					ctx.drawImage(map[y][x].img, x*this.resolution.x, y*this.resolution.y, this.resolution.x, this.resolution.y);
					// ctx.fillRect(x*this.resolution.x, y*this.resolution.y, this.resolution.x, this.resolution.y);
				}
			}
		}

		
		for(var o in world.dynamicObjects){
			// for(var objectType in world.dynamicObjects[o]){	
				var object = world.dynamicObjects[o];
				
				// ctx.strokeStyle = "#000000";
				// ctx.beginPath();
				// ctx.moveTo(object.position.x * this.resolution.x, object.position.y * this.resolution.y);
				// ctx.lineTo((object.position.x + object.direction.x * object.speed) * this.resolution.x, (object.position.y + object.direction.y * object.speed) * this.resolution.y);
				// ctx.stroke();
				if( object.properties.type == ObjectType.HERO){
					// console.log(object.image);
					var oi = object.getImage();
					ctx.drawImage(oi.src, oi.x, oi.y, oi.w, oi.h, object.position.x*this.resolution.x, object.position.y*this.resolution.y, this.resolution.x, this.resolution.y);
					ctx.fillStyle = "#FFFF00";
				} else if( object.properties.type == ObjectType.POINT){
					ctx.fillStyle = "#0000FF";
				} else if( object.properties.type == ObjectType.PROJECTILE){
					ctx.fillStyle = "#FF0000";
				}
				// ctx.fillRect((object.position.x) * this.resolution.x, (object.position.y) * this.resolution.y, this.resolution.x*object.size, this.resolution.y*object.size);
				
			// }
		}
		
		// var ray = Game.savedRay;
		// for(var i in ray){
			// if( ray[i].hit ){
				// ctx.fillStyle = "#00FFFF";
			// } else {
				// ctx.fillStyle = "#00FF00";
			// }
			// ctx.fillRect(ray[i].x*this.resolution.x, ray[i].y*this.resolution.y, 5, 5);
		// }
		
		
	};
}


exports.Game = Game;
