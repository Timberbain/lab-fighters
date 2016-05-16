var p_Objects = require('./gameObject');

function CollisionHandler(){
	this.CalculateMapCollision = function(sx, sy, dx, dy, map, size){
		if( size == undefined ){
			size = 1;
		}
		ray = [];
		var l = Math.sqrt( Math.pow(dx - sx, 2) + Math.pow(dy - sy,2) );
		var vector = {
			x: (dx - sx) / l, 
			y: (dy - sy) / l
		};
		for(var i = 0; i < l; i+=0.01){
			var potpos = {
				x: sx + vector.x*i,
				y: sy + vector.y*i,
				hit: false
			};
			var checkPos = {
				x: sx + vector.x*i, 
				y: sy + vector.y*i,
				hit: false
			};
			
			var xh = Math.round(checkPos.x-(1-size));
			var xl = Math.round(checkPos.x);
			var yh = Math.round(checkPos.y-(1-size));
			var yl = Math.round(checkPos.y);
			
			if( yh < 0 || yh >= map.length ||
				yl < 0 || yl >= map.length ||
				xh < 0 || xh >= map[yh].length || 
				xl < 0 || xl >= map[yl].length ) {
				potpos.hit = false;
								
			} else {
				if(map[yh][xh] != null){// && map[yh][xh].properties.type == p_Objects.ObjectType.WALL && map[yl][xl].properties.type == p_Objects.ObjectType.WALL){
					potpos.hit = true;
					potpos.o = map[yh][xh];
				} else if(map[yl][xl] != null){
					potpos.hit = true;
					potpos.o = map[yl][xl];
				}
			}
			
			ray.push(potpos);
		}
		
		return ray;
	};
	
	// this.CheckCollision = function( object1, object2 ){
		// var r1 = object1.size/2;
		// var r2 = object2.size/2;
		// var distance = Math.sqrt( Math.pow( object1.position.x - object2.position.x, 2) + Math.pow( object1.position.y - object2.position.y, 2) );
		// if( distance < r1 + r2){
			// return true;
		// }
		// return false;
	// };
}

exports.CollisionHandler = CollisionHandler;

