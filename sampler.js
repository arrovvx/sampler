var fs = require('fs');
var settings = JSON.parse(fs.readFileSync('settings.json', 'utf8'));
const debug = require('debug')('sampler');


//import the interface
WSConn = require('./samplerINTF')(settings);

//parsing values
var CHValues = [];
var state = 0;
var ch = 0;
var value = 0;

var success = 0;
var error = 0;

//performance variables
var count = 0;
var sampleSize = 100000 * settings.performanceSampleSize;
var time;

function parseSerial(data){
	for (i = 0; i < data.length;i++){
			
			if (state == 2 && !(data[i] & 128)){
				value += data[i];
				WSConn.store(value, ch);
				state = 0;
				
			} else if (state == 1 && !(data[i] & 128)){
				value += (data[i] << 7);
				state++;
				success++;
				
			} else if (state == 0 && (data[i] & 128) ){
				ch = (data[i] & 124) >> 2;
				value = ((data[i] & 3) << 14);
				state++;
				success++;
				
			} else{
				debug('Serial Data Error! %d Header bit: %d', state, ((data[i] & 128) >> 7));
				error++;
				
				if(state > 0) i--;
				state = 0;
			}
			
	}
	
				
	if(error){
		debug('Error detected. Success: %d, Error: %d', success,error);
		success = 0;
		error = 0;
	}
	
};

function serialPerformance(data){
	
	for (i = 0; i < data.length;i++){
			//performance measurements
			if(count == 0) {
				time = new Date().getTime();
				count++;
			}
			else if(count >= sampleSize) {
				var newtime = new Date().getTime();
				var result = (sampleSize / (3*(newtime - time)/1000));
				
				debug('Sampling Speed: %d Hz', result.toFixed(2));
				
				WSConn.serialport.removeAllListeners('data');
				WSConn.serialport.on('data', parseSerial);
				WSConn.storePerfResults(result);
				
				i = data.length;
				debug('-----------------------------------');
				debug('-----Ending Performance Test-----');
			} else 
				count++;
			
	}
};

WSConn.serialport.on('open', function(){
	WSConn.serialport.flush();
	debug('Serial Opened');
	
	
	if(settings.serialPerformance){
		
		debug('-----Starting Performance Test-----');
		debug('-----------------------------------');
		WSConn.serialport.on('data', serialPerformance);
	} else
		WSConn.serialport.on('data', parseSerial);
	
});

