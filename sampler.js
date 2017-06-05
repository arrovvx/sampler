var fs = require('fs');
var settings = JSON.parse(fs.readFileSync('settings.json', 'utf8'));

//open websocket, this may take a while. 
//module.serialport = serialport;
//module.wsSend = wssClient.send;
//module.store = function(inputValue)

//this is part of main code
WSConn = require('./samplerINTF')(settings);

var BUFFER_SIZE = 250;
var EMG_CHANNEL_NUM = 3;


var buffer = new Buffer(BUFFER_SIZE)
var head = 0;
var tail = 1;
var flushFlag = 0;
var processDataID = 0;
var checksum = 0;

function getBufferIndex(head, length){
	var indices = new Array(length);
	for (var i = 0; i < length; i++)
		indices[i] = (head + i) % BUFFER_SIZE;
	
	return indices;
}

function checkTail(head, tail, length){
	//console.log(head + ' ' + tail + ' ' + length);
	
	if (head >= tail) {
		return (head + length) <= (tail + BUFFER_SIZE);
	}
	return (head + length) <= (tail);
}

/*
var SerialPort = require("serialport").SerialPort;

serialport = new SerialPort("COM3",{
		baudRate: 9600, //115200
		parser: SerialPort.parsers.byteLength(8)
	});

var x = 0;
var qwe;

*/
WSConn.serialport.on('data', function(data){
	
	var newTail = (tail + 1) % BUFFER_SIZE;
	
	for(var i = 0; i < data.length && newTail != head; i++){
		buffer[newTail] = data[i];
		tail = newTail;
		newTail = (newTail + 1) % BUFFER_SIZE;
	}
	//console.log(head + ' ' + tail + ' ' + newTail + " ahoho " + data.toString('hex'));
	if (newTail == head)
		flushFlag = 1;
	
});
qwe = 1;

WSConn.serialport.on('open', function(){
	
	processDataID = setInterval( function(){
		//console.log(head + ' ' + tail + ' ' + " hoho22233 ");
		WSConn.store([qwe,qwe,qwe,qwe,qwe]);
		WSConn.storeAcc([qwe,qwe,qwe,qwe,qwe]);
		qwe += 1;
		qwe %= 1024;
		/*if (buffer[head] == 1){
			if(checkTail(head, tail, EMG_CHANNEL_NUM*2 + 2)) {
				
				var EMGs = new Array(EMG_CHANNEL_NUM);
				bufferIdx = getBufferIndex(head, 2*EMG_CHANNEL_NUM + 2); //2 is from header and checksum, each EMG data is 2 bytes
				checksum = buffer[bufferIdx[1]];
				validCheck = buffer[head];
				
				for (var i = 0; i < EMG_CHANNEL_NUM; i++){
					EMGs[i] = 256 * parseInt(buffer[bufferIdx[2 + 2*i]]) + parseInt(buffer[bufferIdx[2 + 2*i + 1]]);
					//console.log("wwwhoho " + EMGs[i] + ' ' + buffer[bufferIdx[2 + 2*i]] + ' ' + buffer[bufferIdx[2 + 2*i + 1]]);
					validCheck = validCheck ^ buffer[bufferIdx[2 + 2*i]] ^ buffer[bufferIdx[2 + 2*i + 1]];
				}
				//console.log("23123hoho " + EMGs);
				//console.log('checksum: ' + checksum);
				//console.log('validCheck: ' + validCheck);
				if(checksum != validCheck){
					
					var newHead = (head + 1) % BUFFER_SIZE;
					if(newHead != tail)
						head = newHead;
				} else {
					head = (head + EMG_CHANNEL_NUM*2 + 2) % BUFFER_SIZE; 
					//console.log(head + ' ' + tail + ' ' + " hoho33 ");
					//console.log("real value " + EMGs);
					WSConn.store([EMGs[0]]);//[0]EMGs ,EMGs[1],EMGs[2],EMGs[2]
				}
				
				if(flushFlag) {
					head = 0;
					tail = 1;
					flushflag = 0;
				}
			}
			
			
		} else if(buffer[head] == 2) {
			
		} else {
			var newHead = (head + 1) % BUFFER_SIZE;
			if(newHead != tail)
				head = newHead;
		}
			//*/
	}, 2);
});
/*
WSConn.serialport.on('data', function(data){
	qwe = data[0]*32 + data[1];
	WSConn.store([qwe]);
	
});




/*
idd = setInterval( function(){
				
				console.log("hoho" + qwe)
			}, 1000);

/*
Must define parsing function for:

	serialport.on('open', function(){
		console.log('Serial port opened');
		serialport.on('data', function(data){});
	});
*/




/*
var wssClient = new wsClient('ws://192.168.99.101:8889/');

wssClient.on('message', function(message) {
	var controller = JSON.parse(message);
	console.log("server msg " + message);
	
	if(controller.command == "start"){
		
		idd = setInterval( function(){
			wssClient.send(JSON.stringify({"output":1,"input":[500]}));
		}, 10);
		
	} else if(controller.command == "stop"){
		clearInterval(idd);
	}
		
	
	//tock = parseInt(message);
    //console.log('received: %s', message);
});


var SerialPort = require("serialport").SerialPort;	
var serialport = null;			 					//used to create serial read session



	//HOW TO CONTROL THE CONTROLLER TO STORE RAW DATA
	
	e.g. wssClient.send(JSON.stringify({"command": "store", "output":0, "input":[500,22,333], "signalGroupID": 23232312}));
	e.g. wssClient.send(JSON.stringify({"command": "store", "output":1,"input":[500], "signalGroupID": 23232312}));
	
	- you need to send text in json format
	- you need to include command store
	- you need to include input array
	- you need to include output value
	- you need to include signalGroupID to tag your signals
	*****PLEASE WAIT A COUPLE OF SECONDS FOR THE CONTROLLER TO LOAD THE DB*******

*/

/*
	//usually this is used for timing functions, 1000 = milisecs
	var idd = setInterval( function(){
			wssClient.send(JSON.stringify({"output":1,"input":[500]}));
		}, 1000);
		
	//clear when done
	clearInterval(idd);

*/


/*

// this example send an entry to the database when websocket connection is established
wssClient.on('open', function() {
    wssClient.send(JSON.stringify({"command": "store", "output":0, "input":[500,22,333], "signalGroupID": 23232312}));
});


wssClient.on('message', function(message) {
	var controller = JSON.parse(message);
	console.log("server msg " + message);
	
	if(controller.command == "start"){
		
		idd = setInterval( function(){
			wssClient.send(JSON.stringify({"output":1,"input":[500]}));
		}, 1000);
		
	} else if(controller.command == "stop"){
		clearInterval(idd);
	}
		
	
	//tock = parseInt(message);
    //console.log('received: %s', message);
});

wssClient.on('close', function(message) {
	clearInterval(idd);
		
	//tock = parseInt(message);
    //console.log('received: %s', message);
});

//fred's variable sample
var buf = [];
var conExtract=false;
var arraySample=[];
var tempData=[0,0];
var  idd = 0;

/*

//master fred's code
serialport = new SerialPort(systemSerialPort,{baudRate: 115200});
serialport.on('open', function(){
	
	
	console.log('Serial port opened');
	serialport.on('data', function(data){
	

		if(data.length!=0){
			//data.forEach(function(index){
				//buf.push(index);
			//})
			buf=data;
			
			for(i=0; i<buf.length;i++) {
				if(conExtract){
					//extracting the lower byte
					
					tempData[0]=(buf[i]);
					if (addBit){
						tempData[0]=(tempData[0]|128);
					}
					
					value=(tempData[1]>>1)*512+(tempData[1]&1)*256+tempData[0];
					
					if (channel == 1)
						channelVal[0] = value;
					else if(channel == 2)
						channelVal[1] = value;
						
					//arraySample.push([value,channel])
					//reset all values
					conExtract=false;
					tempData=[];
					addBit=false;
					
				}
				else{
					//extracting the upper byte
					
					firstBit=buf[i]>>7;
					if(firstBit){
						
						if(buf[i]&1){
							addBit=true;
						}
						else{
							addBit=false;
						}
						channel=((buf[i]>>3)&15)+1;
						tempData[1]=(buf[i]>>1)&3;
						conExtract=true;
					}
					else{
						tempData=[];
						conExtract=false;
						addBit=false;
					}
				}
			}
			buf=[];
		}
		//console.log(data[0]);
		//
		//for(i = 0; i < maxChannelNum; i++)
			//channelVal[i] = data[0];
		//console.log((data[0]>>> 0).toString(2));
		
	});
});





/*

//random code that might be usefull later

wssClient.on('message', function(message) {
	var controller = JSON.parse(message);
	console.log("server msg " + message);
	
	if(controller.command == "start"){
		
		idd = setInterval( function(){
			wssClient.send(JSON.stringify({"output":1,"input":[500]}));
		}, 1000);
		
	} else if(controller.command == "stop"){
		clearInterval(idd);
	}
		
	
	//tock = parseInt(message);
    //console.log('received: %s', message);
});

wssClient.on('close', function(message) {
	clearInterval(idd);
		
	//tock = parseInt(message);
    //console.log('received: %s', message);
});

//wssClient.send(JSON.stringify({"output":absTick,"input":channelVal}));




wssClient.on('error', function(message) {
	console.log("hoho3" + message);
	if(wssClient){
		console.log(wssClient.OPEN + "hoho84" + wssClient.readyState);
	} else {
		console.log("hoho44447");
	}
});

if(wssClient){
	console.log(wssClient.OPEN + "hoho" + wssClient.readyState);
} else {
	console.log("hoho4444");
}
wssClient.close();
*/


//serialport.close(function (err) {
//	console.log('port closed, Error: ', null != err);
//});
//serialport = null;

/*

//decode signal from arduino master fred sex
		
		
*/

