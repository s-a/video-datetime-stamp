#!/usr/bin/env node

var program = require('commander');
var fs = require('fs');
var path = require('path');
var moment = require('moment');
var shell = require('shelljs');

program
  .version('0.0.1')
  .option('-f, --file', 'Render date time stamp to file')
  .parse(process.argv);

function getVideoDuration(done){
	var exec = require('child_process').exec;
	var child;
	child = exec("ffmpeg -i " + filename + " 2>&1 | grep \"Duration\"| cut -d ' ' -f 4 | sed s/,//",
	  function (error, stdout, stderr) {

	    var duration = stdout.replace(/\n/g, "").split(":");
	    var result = {
	    	hours : parseInt(duration[0]),
	    	minutes : parseInt(duration[1]),
	    	seconds : parseInt(duration[2].split(".")[0]),
	    	milliseconds : parseInt(duration[2].split(".")[1])
	    };
	    done(result);
	    if (error !== null) {
	      console.log('exec error: ' + error);
	    }
	});
}

function logVideoTimeInfo(name, videoTime) {
	console.log(name, moment(videoTime).format("dddd, MMMM Do YYYY, h:mm:ss a") , moment(videoTime).fromNow());
}

function getVideoStartTime(videoEndTime, duration){
	result = videoEndTime;
	result = moment(result).subtract(duration.hours, 'h');
	result = moment(result).subtract(duration.minutes, 'm');
	result = moment(result).subtract(duration.seconds, 's');
	result = moment(result).subtract(duration.milliseconds, 'ms');
	return result;
}

if (program.file)  {
	var filename = program.file[0];
	var outputFilename = filename.split(".");
	outputFilename.splice(outputFilename.length-1, 0, "stamped");
	outputFilename = outputFilename.join(".");
	console.log("Rendering", filename , "to", outputFilename);

	var exec = require('child_process');
	var fontFilename = path.join(/*__dirname, ".." ,*/"font", "OpenSans-Regular.ttf").replace(/\\/g, "/");
	console.log("font:",fontFilename);
//	fontFilename = "OpenSans-Regular.ttf";


	var videoTime = fs.statSync(filename).mtime.getTime();// + "000";

	logVideoTimeInfo("video end", videoTime);
	
	getVideoDuration(function(duration) {
		console.log("duration: ", duration);
		var startTime = getVideoStartTime(videoTime, duration);
		logVideoTimeInfo("video start", startTime);
		var basetime =  startTime.toDate().getTime() + "000";

		console.log("ffmpeg basetime:", basetime);

		var command = "ffmpeg";
		var parms = [];
		parms.push ("-i \"" + filename + "\"");
		parms.push ("-f MP4");
		parms.push ("-vf \"drawtext=expansion=strftime: fontfile=" + fontFilename + ": text='%a %d\\.%m\\.%Y / %H\\:%M\\:%S': x=10:y=10: fontcolor=white: box=1: boxcolor=0x00000000@1: basetime="+basetime+"\"");
	 	//parms.push ("-t 24"); // test 24 seconds
	 	parms.push ("-preset ultrafast");
	 	 //ultrafast, superfast, veryfast, faster, fast, medium (the default), slow, slower, veryslow.
	 	parms.push ("-y");
	 	parms.push (outputFilename);
		console.log("Start ", command + " " + parms.join(" "));
		if (shell.exec(command + " " + parms.join(" ")).code === 0){
			console.log("done.");
		}
	});
}