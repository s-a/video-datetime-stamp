var fs = require("fs");
var assert = require("assert");
var shell = require('shelljs');
var path = require('path'); 
require('should');

/*var program = require('commander');
var fs = require('fs');
var moment = require('moment');
*/
var scriptFilename = path.join(__dirname, "..", "bin", "render-stamp.js");
var videoFilename = path.join(__dirname, "..", "video", "BigBuckBunny_320x180.mp4");
var videoOutFilename = path.join(__dirname, "..", "video", "BigBuckBunny_320x180.stamped.mp4");


describe('render a time stamp to MP4', function(){;
	this.timeout(5000);
    it('should exit with error code 0', function(){;
    	var exitCode = shell.exec("node " + scriptFilename + " --file "  + videoFilename + " --test 2").code;
		exitCode.should.be.equal(0);
  	});

    it('should exists an output file', function(){;
    	
		fs.existsSync(videoOutFilename).should.be.true;
  	});

});