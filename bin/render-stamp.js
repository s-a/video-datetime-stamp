#!/usr/bin/env node

let program = require('commander');
let fs = require('fs');
let path = require('path');
let moment = require('moment');
let shell = require('shelljs');
let filename = '';
let os = process.platform;
let p = null;
let dirname = '';
let result = null;

program
  .version('0.0.1')
  .option('-f, --file <s>', 'Render date time stamp to file')
  .option('-d, --dir <s>', 'Render date time stamp to files')
  .option('-t, --test <n>', 'Render only n seconds of a video for test purposes', parseFloat)
  .parse(process.argv);

filename = program['rawArgs'][3];

for(let i = 0; i < filename.length; i++){
	if(filename[i] != '/' && filename[i] != ':'){
		dirname += filename[i];
	}
	else if(dirname != ''){
		if(filename[i] == '/'){
			dirname += filename[i];
		}
		else if(filename[i] == '\\'){
			dirname += filename[i];
		}
	}
}

if(os.toLowerCase() === 'win32'){
	p = '..\\' + dirname.split('\\').slice(2,-1).join('\\');
}
else {
	p = '../' + dirname.split('/').slice(2,-1).join('/');
}

function getVideoDuration(filename){
	if(filename != undefined && filename != null){
		let exec = require('child_process').exec;
		let child;
		let cmd = "ffmpeg -i " + filename + " 2>&1 | grep \"Duration\"| cut -d ' ' -f 4 | sed s/,//";
		let c = shell.exec(cmd);
		let duration =  (c.replace(/\n|\r/g, ""));
		duration = duration.replace(/\n/g, "").split(":");
		result = {
			hours : parseInt(duration[0]),
			minutes : parseInt(duration[1]),
			seconds : parseInt(()=>{
				if(duration[2] != undefined && duration[2] != null){
					return duration[2].split(".")[0];
				}
				return 0;
			}),
			milliseconds : parseInt(()=>{
				if(duration[2] != undefined && duration[2] != null){
					return duration[2].split(".")[1];
				}
				return 0;
			})
		};
	}
	return result;
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

function getFiles (dir, files_){
    files_ = files_ || [];
	if(os.toLowerCase() === 'win32'){
		dir = '\\' + dir.split('\\').slice(0,-1).join('\\');
	}
	else {
		dir = '/' + dir.split('/').slice(0,-1).join('/');
	}
	let files = fs.readdirSync(dir);
    for (let i in files){
        let name = dir;
		if(os.toLowerCase() === 'win32' && dir[0] != '\\'){
			name += '\\' + files[i];
		}
		else {
			name += '/' + files[i];
		}
        if (fs.statSync(name).isDirectory()){
            getFiles(name, files_);
        } else {
        	if (name.indexOf(".stamped")===-1 && path.extname(name).toLowerCase() === ".mp4"){
            	files_.push(name);
        	}
        }
    }
    return files_;
}


function convertVideo(filename) {
	let outputFilename = filename.split(".");

	outputFilename.splice(outputFilename.length-1, 0, "stamped");
	outputFilename = outputFilename.join(".");
	console.log("Rendering", filename , "to", outputFilename);

	let exec = require('child_process');
	let fontFilename = path.join(__dirname, ".." ,"font", "OpenSans-Regular.ttf").replace(/\\/g, "/");
	console.log("font:",fontFilename);
	
	let videoTime = fs.statSync(filename).mtime.getTime();// + "000";

	logVideoTimeInfo("video end", videoTime);
	
	let duration = getVideoDuration(filename);
	console.log("duration: ", duration);
	

	let startTime = getVideoStartTime(videoTime, duration);
	logVideoTimeInfo("video start", startTime);
	let basetime =  startTime.toDate().getTime() + "000";

	console.log("ffmpeg basetime:", basetime);

	let command = "ffmpeg";
	let parms = [];
	parms.push ("-i \"" + filename + "\"");
	parms.push ("-f MP4");
	parms.push ("-vf \"drawtext=expansion=strftime: fontfile=" + fontFilename + ": text='%a %d\\.%m\\.%Y / %H\\:%M\\:%S': x=10:y=10: fontcolor=white: box=1: boxcolor=0x00000000@1: basetime="+basetime+"\"");
 	if (program.test){
	 	parms.push ("-t " + program.test); // test 5 seconds
 	}
 	parms.push ("-preset ultrafast");
 	 //ultrafast, superfast, veryfast, faster, fast, medium (the default), slow, slower, veryslow.
	parms.push ("-y");
 	parms.push (outputFilename);
	console.log("Start ", command + " " + parms.join(" "));
	if (shell.exec(command + " " + parms.join(" ")).code === 0){
		console.log("done.");
	}
}

if (filename != undefined && filename != null)  {
	let duration = getVideoDuration(filename);
	console.log("duration: ", duration);
	convertVideo(filename);
}
else if(filename == undefined || filename == null){
	console.log(`I am sorry, the file: ${ filename } is not present!`);
}

if (dirname != undefined && dirname != null)  {
	let files = getFiles(dirname);
	for (let i = 0; i < files.length; i++) {
		let fn = files[i];
		convertVideo(fn);
	};
}
else if(dirname == undefined || dirname == null){
	console.log(`I am sorry, the folder: ${ dirname } is not present!`);
}