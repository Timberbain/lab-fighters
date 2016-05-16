function Profiler(){
	
	this.profiles = {};
	this.startTime = new Date().getTime();
	
	this.start = function(id){
		if(this.profiles[id] == undefined){
			this.reset(id);
		}
		this.profiles[id].start = new Date().getTime();
	};
	
	this.end = function(id){
		this.profiles[id].end = new Date().getTime();
		this.profiles[id].acc += this.profiles[id].end - this.profiles[id].start;
		this.profiles[id].count++;
	};
	
	this.log = function(id){
		if(this.profiles[id] != undefined)
			console.log(id, this.profiles[id].count, this.profiles[id].acc, this.profiles[id].acc / this.profiles[id].count);
	};
	
	this.reset = function(id){
		this.profiles[id] = {
			start : 0,
			end: 0,
			acc: 0,
			count: 0
		};
	};

};

exports.isDefined = function( something ){
		return something != null && something != undefined;
	};

exports.Profiler = Profiler;