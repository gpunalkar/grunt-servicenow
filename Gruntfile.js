var require_config = require("./helper/config_validator");

var fs = require('fs');
var path = require('path');
var inquirer = require('inquirer');

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
	
	var questions =
	[{
		type: "checkbox",
		config: "tables",
		message: "What table(s) do you want to pull?",
		choices: Object.keys(snConfig.folders)
	}, {
		type: "confirm",
		config: "existing_files",
		message: "Do you want to pull the existing files?",
		default: false
	}, {
		type: "input",
		config: "specific",
		message: "What filename do you want to pull?",
		when: function (answers) {
			return !answers.existing_files;
		}
	}];
	
    grunt.initConfig({
//        pkg: grunt.file.readJSON('package.json'),
//        pull: snConfig.folders,
//        push: snConfig.folders,
//        watchAndPush: watchObj,
		prompt : {
			pull : {
				options : {
					questions : questions
				}
			}
		}
	
    });
	grunt.registerTask("yo",['prompt:pull','pullSN']);
//    grunt.event.on('watch', function (action, filepath) {
//        grunt.config(['filechanged'], filepath);
//    });

//    grunt.loadNpmTasks('grunt-servicenow');
//    grunt.loadNpmTasks('grunt-contrib-watch');
//    grunt.task.renameTask("watch", "watchAndPush");
//	grunt.registerTask("pullSN",[]);
	grunt.task.loadTasks('./tasks');
	

};