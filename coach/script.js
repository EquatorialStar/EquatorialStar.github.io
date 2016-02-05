"use strict";


window.onload=function(){



var canvas = document.getElementById('canvas');


canvas.onclick = function (e) {
	var objects = View.clickableObjects;

	for (var i = 0; i < objects.length; i++) {
		var object = objects[i];

		// object dimentions
		var halfWidth = object.width / 2;
		var halfHeight = object.font.slice(0, 2) / 2;

		// object pos
		var x1 = object.posX;
		var y1 = object.posY - halfHeight;

		// mouse pos
		var x2 = e.clientX;
		var y2 = e.clientY;


		if (Math.abs(x1 - x2) < halfWidth && Math.abs(y1 - y2) < halfHeight) {
			object._onclick();
			return;
		}
	}
};


/***
 *    ##     ## #### ######## ##      ## 
 *    ##     ##  ##  ##       ##  ##  ## 
 *    ##     ##  ##  ##       ##  ##  ## 
 *    ##     ##  ##  ######   ##  ##  ## 
 *     ##   ##   ##  ##       ##  ##  ## 
 *      ## ##    ##  ##       ##  ##  ## 
 *       ###    #### ########  ###  ###  
 */

/**
 * some all-canvas methods and properties
 * arrangements resize the canvas,
 *   set the center pos, define em
 * arrangements will handle 'resize' event
 */
var View = {
	ctx: canvas.getContext("2d"),

	centerX: window.innerWidth / 2,
	centerY: window.innerHeight / 2,

	// when animation ends, drawLastFrame
	// will be called in case of 'resize'
	drawLastFrame: function () {},

	arrangements: function () {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;

		this.centerX = window.innerWidth / 2;
		this.centerY = window.innerHeight / 2;

		this.em = 20;

		this.drawLastFrame();

		this.resized = true;
	},

	clickableObjects: [],

	sound: {
		glass: document.getElementsByClassName("glass"),
		hero: document.getElementsByClassName("hero"),
		lastPlayed: {
			glass: 0,
			hero: 0
		},
		play: function (name) {
			this.lastPlayed[name] = this.lastPlayed[name] ? 0 : 1;
			this[name][this.lastPlayed[name]].play();
		}
	},
};
/***
 *     ######   ######  ######## ##    ## ######## 
 *    ##    ## ##    ## ##       ###   ## ##       
 *    ##       ##       ##       ####  ## ##       
 *     ######  ##       ######   ## ## ## ######   
 *          ## ##       ##       ##  #### ##       
 *    ##    ## ##    ## ##       ##   ### ##       
 *     ######   ######  ######## ##    ## ######## 
 */

/**
 * creates a Scene object
 * Scene can be assigned objects
 * and animated with given duration
 */
function Scene () {
	this.objects = [];
}


Scene.prototype = {
	addObject: function (obj) {
		this.objects.push(obj);
	},

	removeObject: function (obj) {
		this.objects.removeElement(obj);
	},

	stopRendering: false,
	render: function (duration) {
		this.stopRendering = false;

		var animationStartTime = Date.now();
		var stopTime = 0;
		var objects = this.objects;

		var _render = function () {
			if (this.stopRendering) return;
			if (!this._stopped) {
				var progress = (Date.now() - animationStartTime - this._pauseTime) / duration;

				if (progress >= 1) {
					Model.onanimationend();
					View.drawLastFrame = this.drawLastFrame.bind(this);
					this._pauseTime = 0;
					return;
				}

				var len = objects.length;
				for (var i = 0; i < len; i++) {
					objects[i].draw(progress);
				}
			}

			requestAnimationFrame(_render);
		}.bind(this);

		requestAnimationFrame(_render);
	},

	_pauseTime: 0,

	pause: function () {
		this._pauseStart = Date.now();
		this._stopped = true;
	},

	start: function () {
		this._pauseTime += Date.now() - this._pauseStart;
		this._stopped = false;
	},

	/**
	 * draws last frame of the last animation
	 * should be assigned to View.currentScene
	 */
	drawLastFrame: function () {
		var objects = this.objects;

		for (var i = 0; i < objects.length; i++) {
			objects[i].skipNextFrame = false;
			objects[i].draw(1);
		}
	},

	clear: function () {
		this.stopRendering = true;
		View.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
		View.drawLastFrame = function () {};
	},
};

/***
 *    ######## ######## ##     ## ######## 
 *       ##    ##        ##   ##     ##    
 *       ##    ##         ## ##      ##    
 *       ##    ######      ###       ##    
 *       ##    ##         ## ##      ##    
 *       ##    ##        ##   ##     ##    
 *       ##    ######## ##     ##    ##    
 */

/**
 * Text creates an object with properties:
 * text: actual text to be drawn
 * offsetX and offsetY: offset from the center
 *   screen, the pos of the center is stored
 *   in View.centerX and View.centerY
 * size: a number of em
 *
 * Text inherits from View
 * Text objects should be added to instances of Scene
 */
function Text (text, offsetX, offsetY, size, color, align) {
	// setting default values if not provided
	size = size || 1;
	this.sizeInPixels = size * this.em;
	this.offsetX = offsetX * this.sizeInPixels || 0;
	this.offsetY = offsetY * this.sizeInPixels || 0;
	color = color || "black";
	align = align || "center";

	this.text = text;
	this.align = align;

	this.animations = [];

	// define getter and setter for posX
	// always set with += operator
	// if set, the text will be displaced
	Object.defineProperty(this, "posX", {
		get: function () {
			return this.centerX + this.offsetX;
		},
		set: function (x) {
			this.clear();
			this.offsetX += x * this.sizeInPixels - this.centerX;
			this.draw();
		}
	});

	// define getter and setter for posY,
	// same story
	Object.defineProperty(this, "posY", {
		get: function () {
			return this.centerY + this.offsetY;
		},
		set: function (y) {
			this.clear();
			this.offsetY += y * this.sizeInPixels - this.centerY;
			this.draw();
		}
	});

	Object.defineProperty(this, "onclick", {
		get: function () {
			return this._onclick;
		},
		set: function (fn) {
			if (typeof fn === "function") {
				this._onclick = fn;
				View.clickableObjects.push(this);
			} else if (fn === undefined) {
				this._onclick = null;
				removeElementFromArray(View.clickableObjects, this);
			}
		}
	});

	// appearance information
	this.font = View.em * size + "px monospace";
	this.color = color;
}

// Text inherits from View
Text.prototype = Object.create(View);

/**
 * arrangements are definitions of style of the text
 * which can be run only once
 */
// Text.prototype.arrangements = function () {
// 	var ctx = this.ctx;

// 	ctx.fillStyle = this.color;
// 	ctx.font = this.font;
// 	ctx.textAlign = this.align;
// };

/**
 * that function draws the object
 * if this.animatid is true
 */
Text.prototype.draw = function (progress) {
	// change styles for animation
	// run [animations] functions
	for (var i = 0; i < this.animations.length; i++) {
		this.animations[i](progress);
	}

	// if [animations] changed some style,
	// it must also set skipNextFrame to false
	/*if (this.skipNextFrame && !View.resized) {
		return;
	}*/


	this.clear();

	this.ctx.fillStyle = this.color;
	this.ctx.font = this.font;
	// console.log(this.align);
	this.ctx.textAlign = this.align;

	// draw
	this.ctx.fillText(this.text, this.centerX + this.offsetX, this.centerY + this.offsetY);

	// information for clear
	this.width = this.ctx.measureText(this.text).width;
	this.placeX = this.posX - this.width / 2;



	// once we drawn everything, let it be as it is
	this.skipNextFrame = true;
	View.resized = false;
};

/**
 * fade will be invoked by looping through
 * [animations] in draw function
 */
Text.prototype.fade = function (fadeIn, start, end, progress) {
	if (progress < start || progress > end) return;

	// partialProgress
	progress = (progress - start) / (end - start);

	progress -= 0.1;
	if (progress < 0) progress = 0;
	progress *= 1.2;
	if (progress > 1) progress = 1;

	// will it fade in or out?
	if (!fadeIn) progress = 1 - progress;

	this.color = "rgba(0, 0, 0, " + progress + ")";

	this.skipNextFrame = false;
};

/**
 * these functions set fade in or out
 */
Text.prototype.fadeOut = function (start, end) {
	start = isFinite(start) ? start : 0;
	end = isFinite(end) ? end : 1;
	this.animations.push(this.fade.bind(this, false, start, end));
};
Text.prototype.fadeIn = function (start, end) {
	start = isFinite(start) ? start : 0;
	end = isFinite(end) ? end : 1;
	this.animations.push(this.fade.bind(this, true, start, end));
};

/**
 * clears rect where the text was drawn last time (±5px in height)
 */
Text.prototype.clear = function () {
	this.ctx.clearRect(this.placeX + (this.align === "left" ? this.width/2 : 0),
		this.posY + this.sizeInPixels / 5, this.width, -this.sizeInPixels);
	
	this.skipNextFrame = false;
};


Text.prototype.click = function () {
	View.clickableObjects.push(this);
}

/***
 *    ########  ########   #######   ######   ########  ########  ######   ######         ########     ###    ########  
 *    ##     ## ##     ## ##     ## ##    ##  ##     ## ##       ##    ## ##    ##        ##     ##   ## ##   ##     ## 
 *    ##     ## ##     ## ##     ## ##        ##     ## ##       ##       ##              ##     ##  ##   ##  ##     ## 
 *    ########  ########  ##     ## ##   #### ########  ######    ######   ######         ########  ##     ## ########  
 *    ##        ##   ##   ##     ## ##    ##  ##   ##   ##             ##       ##        ##     ## ######### ##   ##   
 *    ##        ##    ##  ##     ## ##    ##  ##    ##  ##       ##    ## ##    ##        ##     ## ##     ## ##    ##  
 *    ##        ##     ##  #######   ######   ##     ## ########  ######   ######         ########  ##     ## ##     ## 
 */

function ProgressBar (offsetX, offsetY, size) {
	this.offsetX = isFinite(offsetX) ? offsetX * this.em : 0;
	this.offsetY = isFinite(offsetY) ? offsetY * this.em : 0;
	this.size = isFinite(size) ? size * this.em : this.em;
}

ProgressBar.prototype = Object.create(View);

ProgressBar.prototype.number = 2;
/**
 * define getter for posX and posY
 * readonly
 */
Object.defineProperty(ProgressBar.prototype, "posX", {
	get: function () {
		return this.centerX + this.offsetX;
	}
});
Object.defineProperty(ProgressBar.prototype, "posY", {
	get: function () {
		return this.centerY + this.offsetY;
	}
});
/**
 * draws only cicle
 */
ProgressBar.prototype.draw = function (progress) {
	this.clearCircle();

	if (this.reverse) progress = 1 - progress;

	var ctx = this.ctx;

	ctx.lineWidth = this.em/4;
	ctx.lineCap = "round";

	ctx.beginPath();
	ctx.arc(this.posX, this.posY, this.size, -Math.PI/2, Math.PI * 2 * progress - Math.PI/2, false);
	ctx.strokeStyle = "#ff4300";
	ctx.stroke();
	ctx.closePath();
};
ProgressBar.prototype.reverse = false;
/**
 * draws a number inside the circle
 */
ProgressBar.prototype.drawNumber = function () {
	if (this.number === 0) return;

	var ctx = this.ctx;

	ctx.fillStyle = "000";
	ctx.font = this.em * 1.85 + "px arial";

	ctx.fillText(this.number, this.posX, this.posY + this.em / 2);
};
/**
 * clears only circle
 */
ProgressBar.prototype.clearCircle = function () {
	var ctx = this.ctx;

	ctx.lineWidth = this.em/3;
	ctx.lineCap = "round";

	ctx.beginPath();
	ctx.arc(this.posX, this.posY, this.size, 0, Math.PI * 2, false);
	ctx.strokeStyle = "fff";
	ctx.stroke();
};
/**
 * clears both circle and number
 * using clearRect
 */
ProgressBar.prototype.clearAll = function () {
	var radius = this.size * 1.045;
	this.ctx.clearRect(this.posX - radius, this.posY - radius, radius * 2, radius * 2);
}

/***
 *    ##     ##  #######  ########  ######## ##       
 *    ###   ### ##     ## ##     ## ##       ##       
 *    #### #### ##     ## ##     ## ##       ##       
 *    ## ### ## ##     ## ##     ## ######   ##       
 *    ##     ## ##     ## ##     ## ##       ##       
 *    ##     ## ##     ## ##     ## ##       ##       
 *    ##     ##  #######  ########  ######## ######## 
 */

var Model = {
	programs: [
		"legs",
		"arms",
		"back",
		"fuck",
		"pussy"
	],

	stats: {
		howManySetsDone: 0,
	},

	calcSetsInWorkout: function (workout) {
		workout = workout || this.workout;
		var sets = 0;
		for (var i = 0; i < workout.length; i++) {
			var exercise = workout[i];
			sets += exercise.setNumber;
		}

		return sets;
	},

	calcWorkoutTime: function (workout) {
		workout = workout || this.workout;
		var time = 0;
		for (var i = 0; i < workout.length; i++) {
			var ex = workout[i];
			time += ex.setNumber * (ex.repNumber * ex.repTime + ex.restTime);
		}

		return time;
	},
	
	loadProgram: function (name) {
		console.log(name);

		this.workout = [
			{
				name: "getting on nosochky using left leg, with book on your head",
				setNumber: 2,
				repNumber: 15,
				repTime: 2200,
				restTime: 10000
			},
			{
				name: "getting on nosochky using right leg, with book on your head",
				setNumber: 2,
				repNumber: 15,
				repTime: 2200,
				restTime: 10000
			},
			{
				name: "squats with book on your head",
				setNumber: 3,
				repNumber: 30,
				repTime: 3000,
				restTime: 20000
			},
			{
				name: "docks",
				setNumber: 2,
				repNumber: 1,
				repTime: 34000,
				restTime: 15000
			},
			{
				name: "push-ups",
				setNumber: 2,
				repNumber: 10,
				repTime: 2300,
				restTime: 30000
			},
			{
				name: "docks",
				setNumber: 2,
				repNumber: 1,
				repTime: 25000,
				restTime: 15000
			},
			{
				name: "swimming",
				setNumber: 2,
				repNumber: 1,
				repTime: 35000,
				restTime: 15000
			},
			{
				name: "push-ups",
				setNumber: 2,
				repNumber: 7,
				repTime: 2300,
				restTime: 30000
			},
			{
				name: "docks",
				setNumber: 2,
				repNumber: 1,
				repTime: 30000,
				restTime: 15000
			},
			{
				name: "dumbbells on biceps",
				setNumber: 3,
				repNumber: 20,
				repTime: 2000,
				restTime: 20000
			},
			{
				name: "dumbbells on triceps",
				setNumber: 3,
				repNumber: 20,
				repTime: 2000,
				restTime: 20000
			},
			{
				name: "docks",
				setNumber: 2,
				repNumber: 1,
				repTime: 30000,
				restTime: 15000
			},
		];

		this.current = {
			setNumber: this.workout[0].setNumber,
			repNumber: this.workout[0].repNumber,
			exerciseId: 0
		};

		console.log(Model.calcWorkoutTime() / 60000);
		// remove programs from clickableObjects
		View.clickableObjects.splice(0, Model.programs.length);

		greetings.clear.call(greetings);
		get_ready_exercise_name_text.text = this.workout[this.current.exerciseId].name;
		getReady.render(5000);
		this.onanimationend = this.nextRep;
	},

	onanimationend: function () {},

	// changes workout values, etc
	nextRep: function () {
		var current = Model.current;
		var exercise = Model.workout[current.exerciseId];

		current.repNumber--;

		rep_exercise_name_text.text = exercise.name;
		rep_progress.clearAll();
		rep_progress.number = current.repNumber;
		rep_progress.drawNumber();

		View.sound.play("hero");
		repScene.render(exercise.repTime);

		if (current.repNumber === 0) {
			this.onanimationend = this.rest;
		} else {
			this.onanimationend = this.nextRep;
		}
	},

	rest: function (duration) {
		// shortcut
		var current = Model.current;
		var exercise = Model.workout[current.exerciseId];

		// arrange
		current.setNumber--;

		if (current.setNumber === 0) {
			current.exerciseId++;
			exercise = Model.workout[current.exerciseId];
			if (exercise === undefined) {
				this.onanimationend = function () {};
				repScene.clear();

				how_many_sets_done_text.text = 
					this.stats.howManySetsDone + " sets out of " + Model.calcSetsInWorkout();

				how_many_sets_done_text.onclick = function () {
					this.text = this.text.replace(/^\d+/, function (num) {
						return String(++num);
					});
					this.clear();
					this.skipNextFrame = false;
					this.draw();
					this.onclick = undefined;
				};

				congrads.render(1500);
				return;
			}
			current.setNumber = exercise.setNumber;
		}

		current.repNumber = exercise.repNumber;

		// draw
		repScene.clear();
		View.sound.play("glass");
		done_text.alreadyClicked = false;
		done_text.color = "#333";
		done_text.text = "done?";
		restScene.render(exercise.restTime);
		this.onanimationend = function () {
			get_ready_exercise_name_text.text = exercise.name;
			restScene.clear();
			getReady.render(6000);

			this.onanimationend = this.nextRep;
		};
	},
};


/***
 *       ###     ######  ######## ##     ##    ###    ##              ######   ######  ######## ##    ## ######## 
 *      ## ##   ##    ##    ##    ##     ##   ## ##   ##             ##    ## ##    ## ##       ###   ## ##       
 *     ##   ##  ##          ##    ##     ##  ##   ##  ##             ##       ##       ##       ####  ## ##       
 *    ##     ## ##          ##    ##     ## ##     ## ##              ######  ##       ######   ## ## ## ######   
 *    ######### ##          ##    ##     ## ######### ##                   ## ##       ##       ##  #### ##       
 *    ##     ## ##    ##    ##    ##     ## ##     ## ##             ##    ## ##    ## ##       ##   ### ##       
 *    ##     ##  ######     ##     #######  ##     ## ########        ######   ######  ######## ##    ## ######## 
 */


View.arrangements();
// window.addEventListener("resize", View.arrangements.bind(View));


// greetings
var greetings = new Scene();

var hello = new Text("hello", 0, -2.5, 1.5);
greetings.addObject(hello);

// create clickable programs
var programs = Model.programs;
for (var i = 0; i < programs.length; i++) {
	var tmp = new Text(programs[i], -0.7, i * 1.5, 1, "black", "left");
	tmp.fadeIn(0, 1);
	tmp.onclick = Model.loadProgram.bind(Model, programs[i]);
	greetings.addObject(tmp);
}

var greetings_preferences_text = new Text("preferences", -5, 2, .9, "#666");
var greetings_edit_text = new Text("edit", -5, 4, .9, "#666");

greetings.addObject(greetings_preferences_text);
greetings.addObject(greetings_edit_text);

greetings.render(500);


// get ready
var getReady = new Scene();

var get_ready_text = new Text("get ready:", 0, -3, 1.4);
var get_ready_exercise_name_text = new Text("name", 0, -2, 1.1);

get_ready_text.fadeIn(0, 0.1);
get_ready_text.fadeOut(0.9, 1);
get_ready_exercise_name_text.fadeIn(0, 0.1);
get_ready_exercise_name_text.fadeOut(0.9, 1);

getReady.addObject(get_ready_text);
getReady.addObject(get_ready_exercise_name_text);


// rep
var repScene = new Scene();

var rep_exercise_name_text = new Text("asd", 0, -3, 1.4);
var rep_progress = new ProgressBar(0, 1.4, 2.8);

repScene.addObject(rep_exercise_name_text);
repScene.addObject(rep_progress);


// rest
var restScene = new Scene();

var rest_text = new Text("rest", 0, -3, 1.4);
var done_text = new Text("done?", 0, 7, 1, "#333");

var rest_progress = new ProgressBar(0, 1.4, 2.8);
rest_progress.reverse = true;

done_text.onclick = function () {
	if (this.alreadyClicked) return;

	this.text = "done.";
	this.color = "black";
	this.skipNextFrame = false;

	Model.stats.howManySetsDone++;

	this.alreadyClicked = true;
};

document.onkeydown = function (e) {
	if (e.keyCode === 32) {
		done_text._onclick();
		if (how_many_sets_done_text._onclick) {
			how_many_sets_done_text._onclick();
		}
	}
}


restScene.addObject(rest_text);
restScene.addObject(rest_progress);
restScene.addObject(done_text);


// good for you
var congrads = new Scene();
var good_for_you = new Text("good for you", 0, 0, 1.4);
var how_many_sets_done_text = new Text("", 0, 2, 0.9, "#333");
good_for_you.fadeIn(0, 1);
congrads.addObject(good_for_you);
congrads.addObject(how_many_sets_done_text);
};

function removeElementFromArray (array, elem) {
	var index = array.indexOf(elem);
	if (index === -1) return;	
	array.splice(index, 1);
	return array;
}
