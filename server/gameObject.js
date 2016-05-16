var util = require('./util');

var staticVars = {
	ids: 0
};

var ObjectType = {
	OBJECT:0,
	HERO:1,
	POINT:2,
	WALL: 3,
	FLOOR: 4,
	PROJECTILE: 5,
	PARAN: 6,
	FARAN: 7
};

var ActionType = {
	MOVE: 0,
	SHOOT: 1,
	GET_POINT: 2,
	KILL: 3
};

function GameObject(){
	this.properties = {
		id : staticVars.ids++,
		position : {x: 0, y: 0},
		direction : {x: 0, y: -1},
		isKillable : true,
		isDead : false,
		health : 1,
		size : 1,
		sight : 5,
		active : true,
		value: 0,
		isObstacle: false
	};
	
	this.GetSimpleProperties = function(){
		return this.properties;
	};
	
	this.eventHandler = null;

	this.Animate = function( deltaT ){
		
	};
	this.AddAction = function(action, data){
		if( data == undefined ) data = {};
		if( this.eventHandler != null){
			this.eventHandler.Bind( this, action, data );
		}
	};

	this.SetEventHandler = function( eventHandler ){
		this.eventHandler = eventHandler;
		return this;
	};
	
	this.Equals = function( object ){
		return object.properties.id == this.properties.id;
	};
	
	this.checkCollision = function( object ){
		var r1 = this.properties.size/2;
		var r2 = object.properties.size/2;
		var distance = Math.sqrt( Math.pow( this.properties.position.x - object.properties.position.x, 2) + Math.pow( this.properties.position.y - object.properties.position.y, 2) );
		if( distance < r1 + r2){
			this.Collision( object );
			object.Collision( this );
			return true;
		}
		return false;
	};
	
	this.Update = function(){};
	this.Collision = function( object ){};
	
	return this;
}

function PointObject( position ){
	var that = new GameObject();
	that.properties.type = ObjectType.POINT;
	that.properties.position = position;
	that.properties.value = 1;
	that.Collision = function( object ){
		if( object.properties.type == ObjectType.HERO || 
		object.properties.type == ObjectType.PARAN ||
		object.properties.type == ObjectType.FARAN ){
			this.AddAction( ActionType.KILL );
		}
	}
	return that;
}

function Gun(){
	this.damage = 1;
	this.cooldown = 0;
	this.ammo = 100;
	this.Shoot = function(parent){
		this.ammo--;
		return new Bullet(parent, {x:parent.properties.position.x, y:parent.properties.position.y}, {x:parent.properties.direction.x, y:parent.properties.direction.y});
	}
}


function Bullet( parent, position, direction ){
	var that = new GameObject();
	that.properties.type = ObjectType.PROJECTILE;
	that.properties.position = position;
	that.properties.direction = direction;
	that.properties.speed = 20;
	that.properties.size = 0.2;
	that.properties.parent = parent;
	
	that.Update = function( world, deltaT ){
		var realSpeed = Math.sqrt(Math.pow(this.properties.direction.x * this.properties.speed, 2) + Math.pow(this.properties.direction.y * this.properties.speed, 2));
		var speedDiff = realSpeed - this.properties.speed;

		var movementData = {
			x: this.properties.position.x + (this.properties.direction.x * (this.properties.speed - speedDiff)) * deltaT,
			y: this.properties.position.y + (this.properties.direction.y * (this.properties.speed - speedDiff)) * deltaT
		};
		// console.log( realSpeed );
		if( this.properties.speed > 0){
			this.AddAction(ActionType.MOVE, movementData);
		}
	};
	
	that.Collision = function( object ){
		if( object.properties.type == ObjectType.WALL ){
			console.log( "WALLHIT" );
			this.AddAction( ActionType.KILL );
		}
	};
	
	return that;	
}


function HeroObject(position, direction, name){
	var that = new GameObject();
	that.properties.type = ObjectType.HERO;
	that.properties.position = position;
	that.properties.direction = direction;
	that.properties.size = 1;	// value between 0-1
	that.properties.health = 100;
	that.properties.speed = 0;
	that.properties.maxSpeed = 5;
	that.properties.acceleration = 0.5;
	that.properties.deacceleration = 0.5;
	that.properties.name = name;
	that.properties.score = 0;
	that.weapon = new Gun();

	
	that.GetSimpleProperties = function(){
		return {
			type : this.properties.type,
			position : this.properties.position,
			direction : this.properties.direction,
			size : this.properties.size,
			health : this.properties.health,
			name : this.properties.name
		};
	};
	
	that.movementRequested = false;
	
	// console.log(that.properties.id);
	
	that.RequestMovement = function( direction ){
		this.properties.direction = NormalizeDirection(direction);
		this.movementRequested = true;
	};
	that.RequestNoMovement = function(){
		this.movementRequested = false;
	};

	that.RequestAttack = function(){
		this.requestAttack = true;
	};
	
	that.Update = function( world, deltaT ){
		
		if(this.movementRequested){
			if( this.properties.speed < this.properties.maxSpeed ){
				this.properties.speed += this.properties.acceleration;// * deltaT;
			}
		} else {
			this.properties.speed -= this.properties.deacceleration;// * deltaT;
			if( this.properties.speed < 0 ){
				this.properties.speed = 0;
			}
		}
		var realSpeed = Math.sqrt(Math.pow(this.properties.direction.x * this.properties.speed, 2) + Math.pow(this.properties.direction.y * this.properties.speed, 2));
		var speedDiff = realSpeed - this.properties.speed;

		var movementData = {
			x: this.properties.position.x + (this.properties.direction.x * (this.properties.speed - speedDiff)) * deltaT,
			y: this.properties.position.y + (this.properties.direction.y * (this.properties.speed - speedDiff)) * deltaT
		};
		// console.log("New position: ", movementData);

		if( this.properties.speed > 0){
			this.AddAction(ActionType.MOVE, movementData);
		}
		
		if( this.requestAttack ){
			// var actionData = {
				// direction: this.properties.direction,
				// weapon: this.weapon
			// }
			this.AddAction(ActionType.SHOOT);//, actionData);
			this.requestAttack = false;
		}
	}
	
	that.Collision = function( object ){
		if( object.properties.type == ObjectType.POINT ){
			this.AddAction( ActionType.GET_POINT, object.properties.value );
		} else if( object.properties.type == ObjectType.WALL ){
			this.properties.speed = 0;
		} 
		else if( util.isDefined(object.properties.parent) && object.properties.parent.id != object.id && object.properties.type == ObjectType.PROJECTILE ){
			this.properties.speed = 0;
		}
		
	}
	
	return that;
}

function ParanHero(position, direction, name){
	var that = new HeroObject(position, direction, name);
	that.properties.type = ObjectType.PARAN;
	that.properties.health = 100;
	that.properties.speed = 0;
	that.properties.maxSpeed = 20;
	that.properties.acceleration = 0.05;
	that.properties.deacceleration = 0.5;
	that.properties.sight = 3;
	
	var baseRequestMovement = that.RequestMovement;
	that.RequestMovement = function( direction ){
		
		/* For the moment */
		if( direction.x == direction.y ){
			direction.y = 0;
		} else if( Math.abs(direction.x) + Math.abs(direction.y) > 1 ){
			direction.x = 0;
		}		
		baseRequestMovement.call(this, direction );
	}
	
	var baseUpdate = that.Update;
	that.Update = function( world, deltaT ){
		baseUpdate.call(this, world, deltaT );
		// console.log(this.properties);
		this.properties.sight = 5 + this.properties.speed*0.2;
	}
	
	
	var baseCollision = that.Collision;
	that.Collision = function( object ){
		baseCollision.call(this, object);
		if( object.properties.type == ObjectType.FARAN ){
			this.AddAction( ActionType.GET_POINT, object.properties.value );
		}
	}
	
	return that;
}
function FaranHero(position, direction, name){
	var that = new HeroObject(position, direction, name);
	that.properties.type = ObjectType.FARAN;
	that.properties.health = 100;
	that.properties.speed = 0;
	that.properties.maxSpeed = 10;
	that.properties.acceleration = 1;
	that.properties.deacceleration = 1;
	that.properties.sight = 8;
	that.properties.value = 5;
	that.properties.size = 1;
	
	var baseRequestMovement = that.RequestMovement;
	that.RequestMovement = function( direction ){
		baseRequestMovement.call(this, direction );
	}
	
	var baseUpdate = that.Update;
	that.Update = function( world, deltaT ){
		baseUpdate.call(this, world, deltaT );
		console.log(this.properties.position);
		// console.log(this.properties);
		// this.properties.sight = 5 + this.properties.speed*0.2;
	}
	
	var baseCollision = that.Collision;
	that.Collision = function( object ){
		baseCollision.call(this, object);
		if( object.properties.type == ObjectType.PARAN ){
			this.AddAction( ActionType.KILL );
		}
	}
	
	return that;
}


var mapType = {
	FLOOR: 0,
	MUD: 1,
	FIRE: 2,
	WOOD: 3,
	BRICK: 4,
	CONCRETE: 5,
	DIAMOND: 6
}

function MapObject(type, position, direction, img){
	var that = new GameObject();
	that.properties.position = position;
	that.properties.direction = direction | {x:0, y:0};
	that.properties.type = type;
	that.properties.isObstacle = true;
	
	// if(img){
		// that.img = new Image;
		// that.img.src = "images/" + img;
	// }
	switch(type){
		case mapType.FLOOR:
			that.properties.health = 0;
			break;
		case mapType.MUD:
			that.properties.health = 0;
			break;
		case mapType.FIRE:
			that.properties.health = 0;
			break;
		case mapType.WOOD:
			that.properties.health = 5;
			break;
		case mapType.BRICK:
			that.properties.health = 10;
			break;
		case mapType.CONCRETE:
			that.properties.health = 20;
			break;
		case mapType.DIAMOND:
			that.properties.health = 100;
			break;
	}
	that.GetSimpleProperties = function(){
		return {
			type : this.properties.type,
			size : this.properties.size,
			position : this.properties.position
			//direction : this.properties.direction,
			//health : this.properties.health
		};
	};
	return that;
}


/* Private */
function NormalizeDirection(direction){
	return direction;	//TODO
}

exports.ActionType = ActionType;
exports.ObjectType = ObjectType;
exports.staticVars = staticVars;
exports.GameObject = GameObject;
exports.PointObject = PointObject;
exports.Bullet = Bullet;
exports.HeroObject = HeroObject;
exports.ParanHero = ParanHero;
exports.FaranHero = FaranHero;
exports.mapType = mapType;
exports.MapObject = MapObject;