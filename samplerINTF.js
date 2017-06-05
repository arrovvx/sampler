var wsClient = require('ws');						//websocket client
var SerialPort = require("serialport").SerialPort;	//serial port connection

module.exports = function (settings){
	
	var tempInput = [];
	var tempAcc = [];
	var idd= null;
	var counter = 0;
	
	serialport = new SerialPort(settings.serialPort,{
		baudRate: settings.serialBaudRate, 
		parser: SerialPort.parsers.byteLength(8)
	});
	
	serialport.on('error', function(error) {
		console.log('Serial port error: ', error.message);
		process.exit(0);
	})
	
	var wssClient = new wsClient('ws://' + settings.controllerIP + ':' + settings.SamplerWebsocketPort + '/');
	//var wssTLCClient = new wsClient('ws://' + settings.TLCIP + ':' + settings.TLCWebsocketPort + '/');
	
	
	wssClient.on('connection', function(ws) {
	});
	
	wssClient.on('message', function(message) {
		var controller = JSON.parse(message);
		console.log("server msg " + message);
		
		if(controller.command == "start"){
			
			flushTempInput();
			idd = setInterval( function(){
				
				if(tempInput.length == 0) {
					console.log('Error! No EMG input to send.');
				} else {
					data = tempInput.shift()
					wssClient.send(JSON.stringify({"name": "EMG","input":data[0], "timestamp": data[1]})); 
					if(tempInput.length == settings.controllerSendPipe){
						flushTempInput();
					}
				}
				
				if(settings.sendAccelerometerData) {
					if(tempAcc.length == 0) {
						console.log('Error! No accelerometer input to send.');
					} else {
						data = tempAcc.shift()
						wssClient.send(JSON.stringify({"name": "ACC","input":data[0], "timestamp": data[1]}));
						
						if(tempAcc.length == settings.controllerSendPipe){
							flushTempAcc();
						}
					}
				}
				
			}, settings.controllerSendPeriod);
			
		} else if(controller.command == "stop"){
			//serialport.on('data', null);
			clearInterval(idd);
			
		}else if(controller.command == "ping"){
			wssClient.send(JSON.stringify({"message":"pong"})); 
			
		} else if(controller.command == "startPerformance"){
			
			idd = setInterval( function(){
				var time = new Date().getTime();
				wssClient.send(JSON.stringify({"output":1,"input":[1023,1023,1023,1023,1023,1023,1023,1023], "timestamp": time})); 
				counter = counter + 1;
				
				if(counter >= 10000) {
					clearInterval(idd);
					counter = 0;
					wssClient.send(JSON.stringify({"status": "done"}));
					
				} 
				
			}, 1);
		} 
	});
	
	wssClient.on('close', function(message) {
		//serialport.on('data', null);
		clearInterval(idd);
		console.log('Connection to server closed. Message received: %s', message);
		process.exit(0);
	});
	
	wssClient.on('error', function(error) {
		if(error != null) {
			console.log('Websocket error: %s', error);
			process.exit(0);
		}
	});
	
	module.serialport = serialport;
	
	module.wsSend = wssClient.send;
	
	module.store = function(inputValue){
		var time = new Date().getTime();
		if (tempInput.length < settings.controllerSendPipe){
			tempInput.push([inputValue,time]);
		}
	};
	
	module.storeAcc = function(inputValue){
		var time = new Date().getTime();
		if (tempAcc.length < settings.controllerSendPipe){
			tempAcc.push([inputValue,time]);
		}
	};
	
	function flushTempInput(){
		tempInput = [];
	};
	
	function flushTempAcc(){
		tempAcc = [];
	};
	
	return module;
};