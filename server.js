var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
	res.send('<h1>Welcome Realtime Server</h1>');
});

http.listen(3000, function(){
	console.log('listening on *:3000');
});

var onlineCount = 0;

var positions = {};

var random1 = {};
var random2 = {};
var random3 = {};
var random4 = {};



var bonus = {};

var bonusNum = 0;

var names = {};
var colors = {};

var rank = new Array();

function player(id,name,score,color){
	this.id = id;
	this.name = name;
	this.score = score;
	this.color = color;
}

init();

randomBonus();

io.on('connection', function(socket){
	console.log('a user connected');
	
	socket.on('init', function(obj){
		console.log('get init');
		socket.emit('init', {random1: random1, random2: random2, random3: random3, random4: random4, bonus: bonus});

	});

	socket.on('login', function(obj){
		onlineCount++;
		names[onlineCount] = obj.name;
		colors[onlineCount] = getRandomColor();


		console.log('onlineCount = ' + onlineCount + ', name = ' + obj.name + ', color = '+ colors[onlineCount]);


		socket.emit('login',{uid: onlineCount});
		rank.push(new player(onlineCount, obj.name, 0, colors[onlineCount]));
		socket.id = onlineCount;

		updateRank();

	});

	socket.on('logout', function(obj){

		var id = socket.id;
		socket.disconnect();

		for(var i = 0; i < rank.length; i++){
			if(rank[i].id == id)
			{
				rank.splice(i, 1);
				break;
			}
		}
		
		delete positions[id];
		delete colors[id];

		console.log('logout = ' + id);
		io.emit('logout', id);
		updateRank();
	});
  
  	socket.on('update', function(obj){
		//console.log('position.x = ' + obj.position.x);
		//console.log('update id = ' + socket.id);
		positions[socket.id] = obj.position;
		io.emit('download',{positions : positions, colors: colors});
	});


  	socket.on('getBonus', function(obj){
		//console.log('position.x = ' + obj.position.x);
		//应有加分
		

		if(bonus.hasOwnProperty(obj.bonus))
		{
			delete bonus[obj.bonus];

			console.log('user = '+ socket.id +', get score = ' + obj.score);

			for(var i = 0; i < rank.length; i++){
				if(rank[i].id == socket.id)
				{
					rank[i].score += obj.score;
					break;
				}
			}

			rank.sort(function(a,b){
	            return b.score-a.score});


			updateRank();



			socket.emit('getScore', obj.score);

			io.emit('getBonus', {bonus: obj.bonus});
			//console.log('remove bonus = ' + obj.bonus);
			bonusNum--;
			if (bonusNum < 50) 
			{
				randomBonus();
				socket.emit('setBonus', {bonus: bonus});
				console.log('setBonus');
			}
		}
	});

  	socket.on('lostScore', function(obj){

		for(var i = 0; i < rank.length; i++){
			if(rank[i].id == socket.id)
			{
				rank[i].score -= obj.score;
				break;
			}
		}

		updateRank();

		socket.emit('getScore', -obj.score);
	});

});



function init()
{
	for(var i = 0, n = 10201*3; i < n; i++)
		random1[i] = Math.random();

	for(var i = 0, n = 20000*6; i < n; i++)
		random2[i] = Math.random();

	for(var i = 0, n = 12*6; i < n; i++)
		random3[i] = Math.random();

	for(var i = 0, n = 500*5; i < n; i++)
		random4[i] = Math.random();
	console.log('init finish');

}


function randomBonus()
{
	var t;
	while(bonusNum < 100)
	{
		t = Math.round(Math.random() * 500);
		//console.log('t = '+ t);
		if(!bonus.hasOwnProperty(t))
		{
			bonus[t] = 1;
			bonusNum ++;
			//console.log('add '+ t);
		}
	}
	console.log('randomBonus');
}

function updateRank()
{
	var rankName = [];
	var rankScore = [];
	var rankColor = [];

	for(var i = 0; i < rank.length; i++){
		console.log(rank[i].name + ' ' + rank[i].score);
		rankName[i] = rank[i].name;
		rankScore[i] = rank[i].score;
		rankColor[i] = rank[i].color;
	}
	io.emit('rank', {rankName: rankName, rankScore: rankScore, rankColor: rankColor});
}

function getRandomColor(){
  return '#'+(Math.random()*0xffffff<<0).toString(16); 
}



