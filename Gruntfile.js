var require_config = require("./helper/config_validator");

var fs = require('fs');
var path = require('path');

module.exports = function (grunt) {
	require('load-grunt-tasks')(grunt);

	var snConfig = grunt.file.readJSON('.sn-config.json');
//    var watchObj = {};
//
//    for (key in snConfig.folders) {
//        watchObj[key] = {
//            files:['dist/'+key+'/*'],
//            tasks: ['push:'+key+':<%= filechanged %>']
//        };
//    }
	var destination = path.join(process.cwd(), "dist");
	if(!fs.existsSync(destination)){
		fs.mkdirSync(destination);
	}
    grunt.initConfig({
//        pkg: grunt.file.readJSON('package.json'),
//        pull: snConfig.folders,
//        push: snConfig.folders,
//        watchAndPush: watchObj,
			pullSN :{
				foo : [1,2,3]
			}
	
    });

//    grunt.event.on('watch', function (action, filepath) {
//        grunt.config(['filechanged'], filepath);
//    });

//    grunt.loadNpmTasks('grunt-servicenow');
//    grunt.loadNpmTasks('grunt-contrib-watch');
//    grunt.task.renameTask("watch", "watchAndPush");
//	grunt.registerTask("pullSN",[]);
	grunt.task.loadTasks('./tasks');
	

};