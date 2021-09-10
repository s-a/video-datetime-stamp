#!/usr/bin/env node

let program = require('commander');
let fs = require('fs');
let path = require('path');
let moment = require('moment');
let shell = require('shelljs');
let filename = '';
let dirname = '';
let os = process.platform;
let result = null;
let fl = -1;
let dl = -1;
let tl = -1;

program
  .version('0.0.1')
  .option('-f, --file <s>', 'Render date time stamp to file')
  .option('-d, --dir <s>', 'Render date time stamp to files')
  .option('-t, --test <n>', 'Render only n seconds of a video for test purposes', parseFloat)
  .parse(process.argv);

for(let k = 0; k < program['rawArgs'].length; k++){
	if(program['rawArgs'][k] == '--file' && fl == -1){
		fl = k;
	}
	else if(program['rawArgs'][k] == '--dir' && dl == -1){
		dl = k;
	}
	else if(program['rawArgs'][k] == '--test' && tl == -1){
		tl = k;
	}
}

if(fl > -1 && dl == -1){
	filename = program['rawArgs'][fl + 1];
	//This only works if filename is not empty string
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
	//This code extracts directory from file name, making them one and same
	if(os.toLowerCase() === 'win32'){
		dirname = '..\\' + dirname.split('\\').slice(2,-1).join('\\');
	}
	else {
		dirname = '../' + dirname.split('/').slice(2,-1).join('/');
	}
}
else if(fl == -1 && dl > -1){
	dirname = program['rawArgs'][dl + 1];
	if(os.toLowerCase() === 'win32'){
		if(dirname[0] != '\\'){
			dirname = '..\\' + dirname;
		}
	}
	else {
		if(dirname[0] != '/'){
			dirname = '../' + dirname;
		}
	}
}
else if(fl > -1 && dl > -1){
	filename = program['rawArgs'][fl + 1];
	dirname = program['rawArgs'][dl + 1];
}

function getVideoDuration(filename){
	if(filename != undefined && filename != null && filename != ''){
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
	if(dir != '' && dir != undefined && dir != null){
		let files = fs.readdirSync(dir);
		for (let i = 0; i < files.length; i++){
			let name = dir;
			if(os.toLowerCase() === 'win32'){
				name = dir + '\\' + files[i];
			}
			else if(os.toLowerCase() !== 'win32'){
				name = dir + '/' + files[i];
			}
			if (fs.statSync(name).isDirectory()){
				if(files[i][0] != '.'){ //This skips over hidden files
					getFiles(name, files_);
				}
			} else {

				if (name.indexOf(".stamped")===-1 && path.extname(name).toLowerCase() === ".mp4"){
					files_.push(name);
				}
			}
		}
	}
    return files_;
}

function convertVideo(filename) {
	if(filename != undefined && filename != null && filename != ''){
		let outputFilename = filename.split(".");
		outputFilename.splice(outputFilename.length-1, 0, "stamped");
		outputFilename = outputFilename.join(".");

		if(fl > -1 && dl > -1){
			let finalFile = null;
			if(os.toLowerCase() === 'win32'){
				finalFile = outputFilename.slice(1,outputFilename.length).split('\\');
				finalFile = finalFile[finalFile.length - 1];
				outputFilename = dirname + '\\' + finalFile;
			}
			else {
				finalFile = outputFilename.slice(1,outputFilename.length).split('/');
				finalFile = finalFile[finalFile.length - 1];
				outputFilename = dirname + '/' + finalFile;
			}
		}
		outputFilename = outputFilename.replace(' ','\\ ');
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
}

if ((fl > -1 && dl == -1) && filename != undefined && filename != null && filename != '')  {
	let duration = getVideoDuration(filename);
	console.log("duration: ", duration);
	convertVideo(filename);
}
else if ((fl == -1 && dl > -1)&&(dirname != undefined && dirname != null && dirname != ''))  {
	let files = getFiles(dirname);
	for (let i = 0; i < files.length; i++) {
		let fn = files[i];
		convertVideo(fn);
	}
}
else if ((dl > -1 && fl > -1) && filename != undefined && filename != null && filename != '')  {
	let duration = getVideoDuration(filename);
	console.log("duration: ", duration);
	convertVideo(filename);
}