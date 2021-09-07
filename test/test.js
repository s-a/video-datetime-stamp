let fs = require("fs");
let assert = require("assert");
let shell = require('shelljs');
let path = require('path');
let output = null;
const { doesNotMatch } = require("assert");
require('should');

let scriptFilename = path.join(__dirname, "..", "bin", "render-stamp.js");
let videoFilename = path.join(__dirname, "..", "video", "BigBuckBunny_320x180.mp4");
let videoOutFilename = path.join(__dirname, "..", "video", "BigBuckBunny_320x180.stamped.mp4");

let renderVideo = ()=>{
	let exitCode = shell.exec("node " + scriptFilename + " --file "  + videoFilename + " --test 2").code;
	return exitCode;
};	

output = renderVideo();

describe('render a time stamp to MP4', ()=>{
	it('should exit with error code 0', ()=>{
		output.should.be.equal(0);
  	});

    it('should exists an output file', ()=>{
		fs.existsSync(videoOutFilename).should.be.true;
  	});
});