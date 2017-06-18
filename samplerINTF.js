var wsClient = require('ws');						//websocket client
var SerialPort = require("serialport");				//serial port connection
const debug = require('debug')('samplerINTF');		//logging function

debug('Starting Sampler Debug Log');

// Array Remove Function
Array.prototype.remove = function(from, to) {
	var rest = this.slice((to || from) + 1 || this.length);
	this.length = from < 0 ? this.length + from : from;
	return this.push.apply(this, rest);
};

module.exports = function (settings){
	
	//Variables for sending data
	var startSend = 0;
	var tempInput = new Array(settings.channelNumber);
	var timeStamp = 0;
	
	//for performance measurements
	var counter = 0;
	var idd= null;	
	
	//setup the serial port 
	serialport = new SerialPort(settings.serialPort,{
		baudRate: settings.serialBaudRate, 
		parser: SerialPort.parsers.byteLength(8)
	});
	serialport.on('error', function(error) {
		debug('Serial port error: ', error.message);
		process.exit(0);
	})
	
	//set up the websocket port
	var wssClient = new wsClient('ws://' + settings.controllerIP + ':' + settings.SamplerWebsocketPort + '/');
	
	wssClient.on('connection', function(ws) {
	});
	
	wssClient.on('message', function(message) {
		var controller = JSON.parse(message);
		debug("server msg", message);
		
		if(controller.command == "start"){
			startSend = 1;
			
		} else if(controller.command == "stop"){
			startSend = 1;
			
		}else if(controller.command == "ping"){
			wssClient.send(JSON.stringify({"message":"pong"})); 
			
		} else if(controller.command == "startPerformance"){
			idd = setInterval( networkPerformanceTest, 1);
			
		} 
	});
	
	wssClient.on('close', function(message) {
		clearInterval(idd);
		debug('Connection to server closed. Message received: %s', message);
		process.exit(0);
		
	});
	
	wssClient.on('error', function(error) {
		if(error != null) {
			debug('Websocket error: %s', error);
			process.exit(0);
		}
		
	});
	
	//public variables and functions
	module.serialport = serialport;
	
	module.wsSend = wssClient.send;
	 
	module.store = function(inputValue, channel){
		var time = new Date().getTime();
		
		if (channel >= settings.channelNumber){
			debug("Error! Channel number exceeds limit of", settings.channelNumber);
		} else if (tempInput.length < settings.controllerSendBufferSize){
			tempInput[channel] = inputValue - 32000;
			if(channel == 0){
				timeStamp = time;
			} else if(channel == settings.channelNumber - 1 && startSend == 1){
				wssClient.send(JSON.stringify({"name": "EMG","input":tempInput , "timestamp": time})); 
			}
		}
	};
	
	//internal functions
	function flushTempInput(){
		for(var i = 0, len = tempInput.length; i < len; i++){
			tempInput[i] = [];
		}
	};
	
	function networkPerformanceTest(){
		var time = new Date().getTime();
		wssClient.send(JSON.stringify({"output":1,"input":[1023,1023,1023,1023,1023,1023,1023,1023], "timestamp": time})); 
		counter = counter + 1;
		
		if(counter >= 10000) {
			clearInterval(idd);
			counter = 0;
			wssClient.send(JSON.stringify({"status": "done"}));
			
		}
	};
	
	return module;
};