var util = require('./util');

EventEmitter = require('events');
function World(){
	this.staticObjects = [[]];
	this.dynamicObjects = {};
	this.resolution = 0.01;
	this.events = new EventEmitter();
	
	this.SetStaticObjects = function( objects ){
		this.staticObjects = objects;
	};
	this.AddDynamicObject = function( object ) {
		this.dynamicObjects[object.properties.id] = object;
		// for(var i in this.dynamicObjects){
			// console.log("dyn:" , this.dynamicObjects[i].properties.id);
		// }
		return this.dynamicObjects[object.properties.id];
		// console.log(this.dynamicObjects);
		// this.events.on("update", object.update);
	};
	this.RemoveDynamicObject = function( object ){
		// this.events.removeListener("update", object.update);
		delete this.dynamicObjects[object.properties.id];
	};
	
	this.GetDimensions = function(){
		return {w:this.staticObjects[0].length, h:this.staticObjects.length};
	};
	
	this.Update = function( deltaT ){
		for(var c in this.dynamicObjects){
			this.dynamicObjects[c].Update( this, deltaT );
		}
		// this.events.emit("update", this, deltaT);
		
		/* Check Collisions and Cleanup */
		var checked = {};
		for( var i in this.dynamicObjects ){
			var objectA = this.dynamicObjects[i];
			if( objectA.properties.isDead ){
				this.RemoveDynamicObject( objectA );
			} else {
				for( var j in this.dynamicObjects ){
					var objectB = this.dynamicObjects[j];
					if( !(checked[j] && checked[j][i]) && !objectA.Equals(objectB) && !objectB.isDead){
						objectA.checkCollision( objectB );
						checked[i] ? checked[i][j] = true : checked[i] = {j:true};
					}
				}
			}
		}
	};
	
	this.GetStaticObjectsBoxProperties = function(rx, ry, rw, rh){
		var rry1 = ry > 0 ? ry : 0;
		var rrx1 = rx > 0 ? rx : 0;
		var rry2 = ry + rh < this.staticObjects.length ? ry + rh : this.staticObjects.length - 1;
		var rrx2 = rx + rw < this.staticObjects[0].length ? rx + rw : this.staticObjects[0].length - 1;
		
		var requestedStaticObjects = [];
		// console.log(rrx1, rry1, rrx2, rry2);
		for(y = rry1; y <= rry2; y++ ){
			for(x = rrx1; x <= rrx2; x++){
				if( util.isDefined(this.staticObjects[Math.ceil(y)]) && util.isDefined(this.staticObjects[Math.ceil(y)][Math.ceil(x)])) {
					requestedStaticObjects.push( this.staticObjects[Math.ceil(y)][Math.ceil(x)].GetSimpleProperties() );
				}
			}
		}
		return requestedStaticObjects;
	};
	
	this.GetDynamicObjectsBoxProperties = function(rx, ry, rw, rh){
		var dynamicObjects = [];
		for(var dy in this.dynamicObjects){
			if(this.dynamicObjects[dy].properties.position.x > rx && this.dynamicObjects[dy].properties.position.x < rx + rw){
				if(this.dynamicObjects[dy].properties.position.y > ry && this.dynamicObjects[dy].properties.position.y < ry + rh){
					dynamicObjects.push(this.dynamicObjects[dy].GetSimpleProperties());
				}
			}
		}
		return dynamicObjects;
	};
	
	
	/* Animation should not be happening on the server */
	
	// this.Animate = function( deltaT ){
		// for(var c in this.dynamicObjects){
			// this.dynamicObjects[c].Animate( deltaT );
		// }
	// };
	
}

exports.World = World;