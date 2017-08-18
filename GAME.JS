// javinzipkin@gmail.com

// todo
// jump on rat
// look at healthbar
// ask buttons not clickin

var canvas = document.getElementById('gameCanvas'); 
var tools = canvas.getContext('2d');

var currentCharacter;

var touchingCharacter = null;

var playerXDirection = 0;
var playerYDirection = 0;

var mouseCoordinates = new Vector2D();

var jumpCharges = 2;
var touchingLevelDoorway = false;
var pressingQ = false;

var gameState = 'cutscene';
gameState = false;

var animatingSteps = [];
var queuedSteps = [];

var activeDialog = null;
var queuedDialogs = [];

var levels = [];

var currentLevel = new Level();
var otherRoom = new Level();

var screenWidth = document.body.offsetWidth;
var screenHeight = document.body.offsetHeight;
canvas.width = screenWidth;
canvas.height = screenHeight;

var currentStep = null;
var activeButtons = [];


var forceStart = null;
var forceEnd = null;

function changeCharacter(character) {
	currentCharacter = character;
}

function Cutscene() {
	var me = this;
	me.steps = [];

	me.addStep = function(gameObject, action) {
		//
		me.steps.push([gameObject, action, false]);
	}

	me.run = function() {
		for(var stepIndex = 0; stepIndex < me.steps.length; stepIndex++) {
			// THIS CODE WILL RUN AS LONG AS stepIndex < me.steps.length
			var step = me.steps[stepIndex];

			var gameObject = step[0];
			var action = step[1];

			console.log(step);
			queuedSteps.push(step);
		}
	}
}

function Level() {
	var me = this;
	me.gameObjects = [];
	levels.push(me);
}

function Vector2D(x, y) {
	var me = this;
	me.x = x;
	me.y = y;

	me.add = function(anotherVector) {
		return new Vector2D(me.x + anotherVector.x, me.y + anotherVector.y);
	};

	me.subtract = function(anotherVector) {
		return new Vector2D(me.x - anotherVector.x, me.y - anotherVector.y);
	};

	me.normalize = function(){
		var magnitude = me.getMagnitude();
		return new Vector2D(me.x / magnitude, me.y / magnitude);
	}

	me.getMagnitude = function() {
		return Math.sqrt(me.x * me.x + me.y * me.y);
	}

	me.scale = function(amount) {
		return new Vector2D(me.x*amount, me.y*amount);
	}
}

function GameObject(x, y, w, h, color, level) {
	if(level == null) {
		level = currentLevel;
	}

	var me = this;

	me.position = new Vector2D(x, y);
	me.velocity = new Vector2D(0, 0);
	me.text = null;
	me.w = w;
	me.h = h;
	me.tags = [];
	me.color = color;
	me.static = false;
	me.kinematic = false;
	me.fixed = false;
	me.storyObject = false;
	me.grounded = false;
	me.levelDoorway = false;
	me.relative = null;
	me.lifetime = 0;
	me.lifespan = null;

	me.behaviors = [];

	me.destroy = function() {
		level.gameObjects.splice(level.gameObjects.indexOf(me));
	}


	level.gameObjects.push(me);
}

function Character(x, y, w, h, color, level) {
	GameObject.call(this, x, y, w, h, color, level);

	var me = this;

	me.speed = 0.5;
	me.maxSpeed = 3.5;

	me.health = 100;
	me.maxHealth = 100;
	me.healthbar = new GameObject(0, 25, 250, 20, 'red');
	me.healthbar.tags.push('healthbar');
	// me.healthbar.fixed = true;
	me.healthbar.kinematic = true;
	me.healthbar.relative = me;

	me.changeHealth = function( amount ) {
		me.health += amount;

		var decimal = me.health / me.maxHealth;
		me.healthbar.w = 250 * decimal;
	}

	me.say = function(phrase, options) {
		var textObject = new GameObject(125, -125, 250, 100, "gray");
		textObject.text = phrase;
		textObject.storyObject = true;
		activeDialog = textObject;

		if(options) {
			var button = new GameObject(125, -225, 150, 75, 'green');
			button.text = options[0];
			button.storyObject = true;
			// button.selectionValue = options[0];
			activeButtons.push(button);
		}
	}
}

function Enemy(type, x, y) {
	var me = this;

	var w;
	var h;
	var color;

	me.meleeDamage = 0;

	switch(type) {
		case 'giantRat': {
			w = 150;
			h = 50;
			color = 'brown';
			me.speed = 7;
			me.meleeDamage = 5;
		} break;

		case 'catWizard': {
			w = 150;
			h = 50;
			color = 'brown';
			me.speed = 7;
			me.meleeDamage = 5;
		} break;
	}

	Character.call(this, x, y, w, h, color);

	me.tags.push('enemy');

	var xDirection = 1;
	var distanceTravelled = 0;

	var mindstate = 'normal';

	me.think = function() {
		switch(type) {
			case 'giantRat': {
				var differenceVector = currentCharacter.position.subtract(me.position);
				var distance = differenceVector.getMagnitude();

				if(distance < 100) {
					if(mindstate == 'normal') {
						mindstate = 'lunging';
						var normalizedDifference = differenceVector.normalize();
						var scaledDifference = normalizedDifference.scale(10);
						scaledDifference.y += 0.05 * distance;
						me.velocity = scaledDifference;
					}
				}

				me.position.x += xDirection * me.speed;
				distanceTravelled += me.speed;
				if(distanceTravelled > 50) {
					xDirection *= -1;
					distanceTravelled = 0;
				}
			} break;
		}
	}
}

var reese = new Character(0, 0, 50, 50, 'rgb(255, 150, 150)');
currentCharacter = reese;
var margaret = new Character(300, 300, 50, 50, 'rgb(200, 200, 200)');
reese.tags.push('playableCharacter');
margaret.tags.push('playableCharacter');

var rock = new GameObject(30, 30, 60, 75, 'black');
var ground = new GameObject(0, -400, 500, 5, "rgb(100, 100, 100)");
ground.static = true;

var door = new GameObject(100, -300, 60, 10, "rgb(150, 100, 50)");
door.static = true;
door.levelDoorway = otherRoom;

var someRock = new GameObject(10, 0, 50, 50, 'green', otherRoom);

var ground2 = new GameObject(200, -300, 500, 5);
ground2.static = true;

var rat = new Enemy("giantRat", 500, 100);
// var wizard = new Enemy("catWizard", 400, 200);

var introCutscene = new Cutscene();
// introCutscene.addStep(player, {
// 	nature: 'move',
// 	position: new Vector2D(100, -200)
// 	// seconds: 3
// });
// introCutscene.addStep(player, {
// 	nature: 'speak',
// 	text: "In a faraway land where the letter Z was pronounced very weird, lived a prestigious royal family in their-"
// });

introCutscene.addStep(reese, {
	nature: 'ask',
	text: "You there! Player! Why don’t you put something in?",
	options: ['blue', 'green', 'yellow'],
	callback: function(option) {
		console.log("YOU SELECTED THE COLOR " + option);
	}
});

// introCutscene.addStep(someRock, {
// 	nature: 'move',
// 	position: new Vector2D(1, 0)
// });

// gameState = 'cutscene';
introCutscene.run();

function localToWorld(x, y){
	var xOffset = Math.floor(screenWidth / 2);
	var yOffset = Math.floor(screenHeight / 2);

	return new Vector2D(
		x += (currentCharacter.position.x - xOffset),
		y += (currentCharacter.position.y + yOffset)
	);
}

window.addEventListener('mousedown', function(event) {
	// console.log(currentStep[1].nature);
	if(currentStep[1].nature == 'speak') {
		if(activeDialog != null) {
			activeDialog.destroy();
			if(queuedDialogs.length > 0) {
				activeDialog = queuedDialogs.shift();
			} else {
				activeDialog = null;
			}
		}
	} else if(currentStep[1].nature == 'ask') {
		for(var index = 0; index < activeButtons.length; index++) {
			var activeButton = activeButtons[index];
			var collisionTest = new GameObject(event.clientX, -event.clientY, 1, 1);
			var check = checkCollision(collisionTest, activeButton);
			if(check) {
				console.log(collisionTest.position);
				currentStep[1].callback(activeButton.text);
				animatingSteps.splice(animatingSteps.indexOf(currentStep));
				// currentStep = 
			}

			collisionTest.destroy();
		}
	}

	if(currentCharacter == margaret) {
		var worldPosition = localToWorld(event.clientX, -event.clientY);
		forceStart = worldPosition;
	}
	
});

window.addEventListener('mouseup', function(event) {
	//// QUEEN FUNCTIONALITY
	if(currentCharacter == margaret) {
		var worldPosition = localToWorld(event.clientX, -event.clientY);
		forceEnd = worldPosition;
		var differenceVector = forceEnd.subtract(forceStart);
		// differenceVector = differenceVector.normalize()
		differenceVector = differenceVector.scale (0.05);
		for(var objectIndex = 0; objectIndex < currentLevel.gameObjects.length; objectIndex++) {
			var object = currentLevel.gameObjects[objectIndex];
			if(object.tags.indexOf('healthbar') != -1) {
				continue;
			}

			if (object.static == false) {
				object.velocity = object.velocity.add(differenceVector);	
			}
		}
	}
});

window.addEventListener('mousemove', function(event) {
	mouseCoordinates = localToWorld(event.clientX, -event.clientY);
});

window.addEventListener('keydown', function(banana) {
	if(gameState == 'cutscene') {
		return false;
	}

	if(banana.keyCode == 84) {
		//T
		if(touchingCharacter) {
			currentCharacter = touchingCharacter;
			touchingCharacter = false;
		}
	}

	if(banana.keyCode == 87) {
		// W KEY
		playerYDirection = 1;
	}

	if(banana.keyCode == 83){
		// S
		playerYDirection = -1;
	}

	if(banana.keyCode == 69){
		// E
		if (currentCharacter == reese) {
			var randomColor = 'rgb('
				+ Math.floor(Math.random() * 255) + ','
				+ Math.floor(Math.random() * 255) + ','
				+ Math.floor(Math.random() * 255) + ')';
			var magicOrb = new GameObject(reese.position.x, reese.position.y, 50, 50, randomColor);
			magicOrb.kinematic = true;
			// mouseCoordinates
			var differenceVector = mouseCoordinates.subtract(reese.position);
			differenceVector = differenceVector.normalize();
			differenceVector = differenceVector.scale(10);
			magicOrb.velocity = differenceVector;
			magicOrb.behaviors.push(function() {
				magicOrb.w -= 1;
				magicOrb.h -= 1;
				if(magicOrb.w <= 0) {
					magicOrb.destroy();
				}
			});
		}
	}
	if(banana.keyCode == 65) {
		// A
		playerXDirection = -1;
	}
	if(banana.keyCode == 68) {
		// D
		playerXDirection = 1;
	}
	if(banana.keyCode == 81) {
		// Q

		if (currentCharacter == reese) {
			var directions = [
				new Vector2D(0, -10),
				new Vector2D(0, 10),
				new Vector2D(7, 7),
				new Vector2D(-7, 7),
				new Vector2D(7, -7),
				new Vector2D(-7, -7),
				new Vector2D(-10, 0),
				new Vector2D(10, 0)
			];

			var index = 0;
			while(index < 8) {
				///

				var magicMissile = new GameObject(reese.position.x, reese.position.y, 10, 10, 'magenta');
				magicMissile.tags.push('projectile');
				magicMissile.lifespan = 2500;
				magicMissile.kinematic = true;
				magicMissile.velocity = directions[index];
				index++;
			}
		}

		if (currentCharacter == margaret) {
			pressingQ = true;
		}

	}
	if(banana.keyCode == 82) {
		// R
		if(touchingLevelDoorway) {
			currentLevel = touchingLevelDoorway;
		}
	}

	if(banana.keyCode == 32) {
		if(jumpCharges > 0) {
			currentCharacter.velocity.y = 5;
			jumpCharges -= 1;
		}
	}
});

window.addEventListener('keyup', function(banana) {
	if(banana.keyCode == 87) {
		// W KEY
		playerYDirection = 0;
	}

	if(banana.keyCode == 83){
		// S
		playerYDirection = 0;
	}

	if(banana.keyCode == 65) {
		// A
		playerXDirection = 0;
	}
	if(banana.keyCode == 68) {
		// D
		playerXDirection = 0;
	}

	if(banana.keyCode == 81) {
		//Q
		if (currentCharacter == margaret) {
			pressingQ = false;
		}
	}

	if(banana.keyCode == 32) {
		// SPACEBAR
	}
});

function checkCollision(gameObjectA, gameObjectB) {
	var leftXA = gameObjectA.position.x;
	var rightXA = leftXA + gameObjectA.w;
	var topYA = gameObjectA.position.y;
	var bottomYA = topYA - gameObjectA.h;

	var leftXB = gameObjectB.position.x;
	var rightXB = leftXB + gameObjectB.w;
	var topYB = gameObjectB.position.y;
	var bottomYB = topYB - gameObjectB.h;

	if(
		rightXA < leftXB
		|| rightXB < leftXA
		|| bottomYA > topYB
		|| bottomYB > topYA
	) {
		return false;
	} else {
		return true;
	}
}

var lastUpdate = new Date();
function update() {
	var currentTime = new Date();

	var deltaTime = currentTime - lastUpdate;

	if(currentStep) {
		// console.log(currentStep);
	}

	tools.clearRect(0, 0, screenWidth, screenHeight);

	var gameObjects = currentLevel.gameObjects;

	if(animatingSteps.length == 0) {
		if(queuedSteps.length > 0) {
			animatingSteps.push(queuedSteps.shift());
		} else if(activeDialog == null) {
			gameState = false;
		}
	}

	for(var stepIndex = 0; stepIndex < animatingSteps.length; stepIndex++) {
		currentStep = animatingSteps[stepIndex];

		currentStep.setup = false;

		var gameObject = currentStep[0];
		var action = currentStep[1];
		var initialized = currentStep[2];

		switch(action.nature) {
			case 'move': {
				var directionVector = action.position.subtract(gameObject.position);
				var normalizedDirection = directionVector.normalize();
				// var scaledVector = normalizedDirection.scale(1);

				if(directionVector.getMagnitude() <= 0.5) {
					gameObject.position = action.position;
					gameObject.velocity = new Vector2D(0, 0);
					animatingSteps.splice(animatingSteps.indexOf(currentStep));

				} else {
					gameObject.velocity = normalizedDirection;
				}
			} break;

			case 'speak': {
				gameObject.say(action.text);
				animatingSteps.splice(animatingSteps.indexOf(currentStep));
			} break;

			case 'ask': {
				if(initialized == false) {
					gameObject.say(action.text, action.options);
					currentStep[2] = true;
				}
			} break;
		}
	}


	for(var objectIndex = 0; objectIndex < gameObjects.length; objectIndex++) {
		var object = gameObjects[objectIndex];

		if(currentCharacter == margaret && pressingQ == true && object.static != true) {
			var differenceVector = mouseCoordinates.subtract(object.position);
			if (differenceVector.getMagnitude() < 400) {
				object.velocity = differenceVector.scale(1 / differenceVector.getMagnitude());
			}
		}

		if(object.behaviors.length) {
			for (var behaviorIndex = 0; behaviorIndex < object.behaviors.length; behaviorIndex++) {
				var behavior = object.behaviors[behaviorIndex]
				behavior();
			}
		}

		if(object.tags.indexOf('enemy') != -1) {
			// is an enemy
			object.think();
		}

		if(object.lifespan != null) {
			object.lifetime += deltaTime;
			if(object.lifetime > object.lifespan) {
				object.destroy();
				objectIndex--;
				continue;
			}
		}

		if(object.storyObject == false) {
			object.position = object.position.add(object.velocity);

			if (object.grounded == true) {
				//// COLLISION!
				if(object.velocity.x != 0 && (object != currentCharacter || playerXDirection == 0)) {
					if(object.velocity.x > 0) {
						object.velocity.x -= 0.15;
						if(object.velocity.x < 0) {
							object.velocity.x = 0;
						}
					}
					else if (object.velocity.x < 0) {
						object.velocity.x += 0.15;
						if(object.velocity.x > 0) {
							object.velocity.x = 0;
						}
					}
				}
			}

			var staticCollision = false;

			if(object == currentCharacter) {
				touchingLevelDoorway = false;
			}

			for(var colliderIndex = 0; colliderIndex < gameObjects.length; colliderIndex++) {
				var collider = gameObjects[colliderIndex];
				if(object == collider) {
					continue;
				}

				if(checkCollision(object, collider)) {
					//// STATIC AND STATIC!
					if((!object.static && !object.kinematic) && collider.static) {
						staticCollision = true;
						object.velocity.y = 0;

						// if(!object.grounded) {
							object.grounded = true;

							if(object == currentCharacter) {
								jumpCharges = 2;
							}

							var bottomObjectY = (object.position.y - object.h);
							offsetY = collider.position.y - bottomObjectY;

							object.position.y += offsetY;
						// }
					}

					if(object == currentCharacter && collider.tags.indexOf('playableCharacter') != -1) {
						touchingCharacter = collider;
					}

					if(object == currentCharacter && collider.tags.indexOf("enemy") != -1) {
						currentCharacter.health -= collider.meleeDamage;
					}

					if(collider.levelDoorway && object == currentCharacter) {
						touchingLevelDoorway = collider.levelDoorway;
					}
				} else {
					// movePlayer(0, -2);
				}
			}

			if(staticCollision == false) {
				object.grounded = false;
			}

			if(!object.static && !object.grounded && !object.kinematic) {
				object.velocity.y -= 0.1;
			}
		}

		if(object.color == null) {
			tools.fillStyle = 'black';
		} else {
			tools.fillStyle = object.color;
		}

		var xOffset = Math.floor(screenWidth / 2);
		var yOffset = Math.floor(screenHeight / 2);

		var drawX;
		var drawY;
		if(object == currentCharacter) {
			tools.fillRect(xOffset, yOffset, object.w, object.h);
		} else {
			drawX = object.position.x;
			drawY = object.position.y;

			if(object.relative) {
				drawX += object.relative.position.x;
				drawY += object.relative.position.y;
			}

			if(!object.fixed) {
				drawX -= (currentCharacter.position.x - xOffset);
				drawY -= (currentCharacter.position.y + yOffset);
			}

			tools.fillRect(drawX, -drawY, object.w, object.h);
		}


		tools.fillStyle = 'black';

		if(object.text != null) {
			var words = object.text.split(' ');
			tools.font = "20px serif";

			var line = "";
			var yOffset = 0;

			for(var wordIndex = 0; wordIndex < words.length; wordIndex++) {
				var word = words[wordIndex];

				if(wordIndex > 0) {
					line += ' ';
				}

				line += word;

				var textMeasure = tools.measureText(line);

				if(textMeasure.width > 200) {
					tools.fillText(line, object.position.x + 20, -object.position.y + 20 + yOffset);
					yOffset += 20;
					line = "";
				}
			}

			if(line.length > 0) {
				tools.fillText(line, object.position.x + 20, -object.position.y + 20 + yOffset);
			}

		}
	}

	//// NEW PLAYER PHYSICS!
	currentCharacter.velocity.x += playerXDirection * currentCharacter.speed;

	if(currentCharacter.velocity.x > 0 && currentCharacter.velocity.x > currentCharacter.maxSpeed) {
		currentCharacter.velocity.x = currentCharacter.maxSpeed;
	} else if(currentCharacter.velocity.x < 0 && currentCharacter.velocity.x < -currentCharacter.maxSpeed) {
		currentCharacter.velocity.x = -currentCharacter.maxSpeed;
	}

	if (currentCharacter.position.y < -1500) {
		currentCharacter.position.x = 0;
		currentCharacter.position.y = 0;
	}

	lastUpdate = currentTime;

	setTimeout(update, 15);
}

update();
