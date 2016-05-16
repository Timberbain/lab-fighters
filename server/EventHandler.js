var p_CollisionHandler = require('./CollisionHandler');
var p_Objects = require('./gameObject');

function EventHandler(){
	
	this.actionList = [];
	this.collisionHandler = new p_CollisionHandler.CollisionHandler();
	
	this.Bind = function( object, action, data ){
		this.actionList.push({whom: object, type: action, data: data});
	};
	
	this.Update = function( world ){
				
		while( this.actionList.length > 0 ){
			var action = this.actionList.shift();

			switch( action.type ){
				case p_Objects.ActionType.MOVE:
					this.Move( world, action.whom, action.data );
					break;
				case p_Objects.ActionType.SHOOT:
					this.Shoot( world, action.whom );
					break;
				case p_Objects.ActionType.KILL:
					this.KillObject( world, action.whom );
					break;
				case p_Objects.ActionType.GET_POINT:
					this.GetPoint( action.whom, action.data);
					break;
			}
		}
		
	};
	
	this.Move = function( world, object, data ){
		var sx = object.properties.position.x;// + object.size/2;
		var sy = object.properties.position.y;// + object.size/2;
		var size = object.properties.size;

		var ray = this.collisionHandler.CalculateMapCollision(
			sx, sy, data.x, data.y, world.staticObjects, size);
		var prevpos = {x:sx,y:sy};
		for(var r in ray){
			if(ray[r].hit){
				
				// console.log( ray[r].o );
				// console.log("Ray: " + ray[r].y + ", " + ray[r].x);
				object.Collision( ray[r].o );
				if( ray[r].o.properties.isObstacle ){
					object.properties.position.x = prevpos.x;
					object.properties.position.y = prevpos.y;
				}
				
				return;
			}
			prevpos = {x: ray[r].x, y:ray[r].y};
		}
		object.properties.position.x = prevpos.x;
		object.properties.position.y = prevpos.y;
	};
	this.Shoot = function( world, object ){
		var projectile = object.weapon.Shoot(object);
		projectile.SetEventHandler( this );
		world.AddDynamicObject( projectile );
	};
	
	this.KillObject = function( world, object ){
		if(object.properties.isKillable){
			object.properties.isDead = true;
		}
	};
	
	this.GetPoint = function( object, point ){
		object.properties.score += point;
		// console.log( object.properties.score );
	};
	
	
}

exports.EventHandler = EventHandler;