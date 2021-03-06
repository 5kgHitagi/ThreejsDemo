#基于three.js和node.js的3d联网游戏体验实践

##概述

本次作业通过three.js官方示例[misc_controls_pointerlock](http://threejs.org/examples/#misc_controls_pointerlock)学习three.js的基本使用方法。并在示例的基础上，添加游戏元素，以实践three.js。添加多人联网功能，以体验node.js中websocket的使用。

##游戏内容
在位置随机的方块群中，加分道具随机的出现在一些方块上。玩家以第一人称视角在场景中移动，收集加分道具。收集位置越高的道具可以获得约多分数，从高处掉落会减少玩家得分。游戏支持多人联网，可以实时显示其他玩家的运动，积分排名。

##three.js
three.js是JavaScript编写的WebGL第三方库。提供了非常多的3D显示功能。使用户可以很方便的编写web3d程序。3d游戏主要包括绘制场景，控制人物运动两部分。

###绘制场景
three.js程序的基本组成元素为scene, camera, renderer。我们通过下面的代码可以很方便的创建他们。


	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );
    renderer = new THREE.WebGLRenderer();
可以看到这里创建了一个透视摄像机，这表示摄像机将以透视投影的方式呈现画面。
scene代表了画面中场景的容器，我们可以通过add和remove方法向场景中添加对象。

	geometry = new THREE.BoxGeometry( 20, 20, 20 );
	for ( var i = 0, t = 0; i < 500; i ++ , t += 5) {

		material = new THREE.MeshPhongMaterial( { specular: 0xffffff, shading: THREE.FlatShading, vertexColors: THREE.VertexColors } );

		boxes[i] = new THREE.Mesh( geometry, material );
		boxes[i].position.x = Math.floor( random4[t] * 20 - 10 ) * 20;
		boxes[i].position.y = Math.floor( random4[t+1] * 20 ) * 20 + 10;
		boxes[i].position.z = Math.floor( random4[t+2] * 20 - 10 ) * 20;		
		scene.add( boxes[i] );
	}
上述代码通过指定几何形状以及材质循环创建了500个方块并加入场景中，作为游戏中的地图。
renderer是场景的渲染器，可以根据给定的scene和camera绘制画面

	function animate() {
		requestAnimationFrame( animate );
		renderer.render( scene, camera );
	}
通过将渲染函数放在动画函数中，实现逐帧绘制。

这里在原本地图的基础上，我添加了代表玩家的人物的立方体，立方体颜色随机产生，以区别不同的玩家。并在方块上随机生成了小金球，作为加分道具。


###控制人物运动
控制人物运动实际上就是控制代表玩家视野的camera运动。three.js提供了PointerLockControls.js库，支持以鼠标控制朝向，方便的进行移动。

	controls = new THREE.PointerLockControls( camera );
	
	controls.getObject().translateX( velocity.x * delta );
	controls.getObject().translateY( velocity.y * delta );
	controls.getObject().translateZ( velocity.z * delta );
把camera作为控制对象，得到控制器。监听键盘实践，计算出合适的xyz方向位移，PointerLockControls会根据当前朝向计算出camera的正确位置。
##node.js

node.js是一个Javascript运行环境。程序员可以编写系统级或者服务器端的Javascript代码，交给 Node.js来解释执行。node.js的Web开发框架Express，可以帮助程序员快速建立web站点。Socket.IO是一个开源的WebSocket库，它通过node.js实现WebSocket服务端，同时也提供客户端JS库。
这里采用node.js＋Socket.IO的方式，为游戏添加WebSocket的联网支持。

###环境搭建
首先安装npm(node package manager)

	brew install npm

在工程目录下通过npm安装express和socket.io

	npm install --save express
	npm install --save socket.io
安装成功后目录下会出现一个新的文件夹node_modules，包含了所需要的内容。此时可以开始编写服务端的代码了。
###服务端
创建服务器文件server.js

	var app = require('express')();
	var http = require('http').Server(app);
	var io = require('socket.io')(http);
	
	app.get('/', function(req, res){
		res.send('<h1>Welcome Realtime Server</h1>');
	});
	
	http.listen(3000, function(){
		console.log('listening on *:3000');
	});
	
	io.on('connection', function(socket){
		console.log('a user connected');
		
		socket.on('init', function(obj){
			console.log('get init');
			socket.emit('init', {random1: random1, random2: random2, random3: random3, random4: random4, bonus: bonus});
	
		});
	});

这里创建了一个监听3000端口的服务器，一旦有websocket连接发生便会调用io.on注册的时间处理函数，参数为连接的socket。函数中可以对应的socket监听。通过io.emit方法可以向所有连接发出广播，通过socket.emit方法可以向制定连接发送数据。这里若有客户端向服务器发送init请求，服务器返回创建地图所需的随机数。
	
	node server.js
	
通过node指令可以启动服务器。

服务器的功能主要为

1. 提供创建地图所需的随机数，使得每个玩家拥有同样的地图
2. 为每个玩家分配一个代表色
3. 获取玩家的位置，并发送给每个玩家
4. 获取每个玩家得分失分情况，建立排行榜
5. 随机生成加分道具的位置，并在数量过少时补充


###客户端
客户端websockt方法与服务端类似

	socket = io.connect('ws://localhost:3000');
	socket.emit('init', {});
	socket.on('init', function(obj){
		random1 = obj.random1;
		random2 = obj.random2;
		random3 = obj.random3;
		random4 = obj.random4;
		bonus = obj.bonus;
		console.log('random1[0] = ' + random1[0]);
		init();
		animate();
	});
	
io.connect方法向服务器发起连接，socket.emit方法发送请求，socket.on监听事件。
客户端主要负责，向服务器实时上传玩家当前状况，位置，得分，失分等。并从服务器获渲染画面所需的各种信息，其他玩家的位置，加分道具的位置等。

##总结
通过这次作业，体验了three.js和node.js下，web3d联网游戏的开发。给我最大的感受是各类对底层封装的库，能给编程人员带来很大的方便，让程序员能更专注于逻辑的实现。three.js相较于原生的webgl简便了很多，创建各种几何图形只需要一个方法，相机和运动也可以方便的控制。node.js让我体验到了javascript的强大，一个文件一个指令就可以设立一个服务器，十分轻量级。各类封装虽然给编程带来了很大方便，但是也让程序员越来越远离底层和原理，希望不要被惯坏了才好啊。
