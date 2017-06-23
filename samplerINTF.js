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
	var tempInput = new Array(settings.controllerPayloadSize);
	var timeStamp = 0;
	var payloadNum = 0;
	
	for(var index = 0, len=settings.controllerPayloadSize; index < len; index++){
		tempInput[index] = new Array(settings.channelNumber);
	}
	
	//for performance measurements
	var counter = 0;
	var idd= null;
	var payload = [];
	var perfResult = 0;	
	
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
			startSend = 0;
			
		}else if(controller.command == "ping"){
			wssClient.send(JSON.stringify({"message":"pong"})); 
			
		} else if(controller.command == "startPerformance"){
			var oneLoad = [];
			for(var i = 0, len = settings.channelNumber; i < len; i++){
				oneLoad.push(1023);
			}
			for(var i = 0, len = settings.controllerPayloadSize; i < len; i++){
				payload.push(oneLoad);
			}
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
		
		if (channel >= settings.channelNumber){
			debug("Error! Channel number exceeds limit of", settings.channelNumber);
		} else {
			tempInput[payloadNum][channel] = inputValue;
			
			if(channel == 0){
				timeStamp = new Date().getTime();
			}
			
			if(channel == settings.channelNumber - 1 && startSend == 1){
				payloadNum++;
				if(payloadNum >= settings.controllerPayloadSize){
					wssClient.send(JSON.stringify({"name": "audio","input":tempInput , "timestamp": timeStamp})); 
					payloadNum = 0;
				}
				
			}
		}
	};
	
	module.storePerfResults = function(result){
		
		perfResult = result;
	};
	
	//internal functions
	function flushTempInput(){
		
		for(var i = 0, len = tempInput.length; i < len; i++){
			tempInput[i] = [];
		}
	};
	
	function networkPerformanceTest(){
		
		var time = new Date().getTime();
		wssClient.send(JSON.stringify({"output":1,"input":payload, "timestamp": time})); 
		counter = counter + 1;
		
		if(counter >= 10000) {
			clearInterval(idd);
			counter = 0;
			wssClient.send(JSON.stringify({"status": "done"}));
			
		}
	};
	
	return module;
};