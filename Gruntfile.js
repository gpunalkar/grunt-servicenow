var ServiceNow = require('./services/snclient.js');
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
	grunt.registerTask('pullSN', 'Pull command.', function (folderName) {
        
		var done = this.async();
        require_config().then(function (config) {
			
			var snHelper = new ServiceNow(config);

			var query = "name" + "STARTSWITH" + 'solution';

			
			
			var folder_path = path.join(destination,folderName);

			if(!fs.existsSync(folder_path)){
				fs.mkdirSync(folder_path);
			}
			
			snHelper.getRecords(config.folders[folderName].table,query).on("complete",function(data,response){
				if(data.code === 'ECONNREFUSED' ){
					console.log(data);
				} 
				else{
					for(var i = 0; i < data.result.length; i++){
						var content = data.result[i][config.folders[folderName].field];
						var filename = data.result[i].name;

						if('extension' in config.folders[folderName]){
							filename = filename + "." + snConfig.folders[folderName].extension;
						}
						var file_path = path.join(folder_path, filename);
						fs.writeFile(file_path, content, function(err){

							if(err){
								console.error("ERR",err);
							}
							else{
								console.log("Touching file " + file_path);
								// why is this showing only the second files name twice

							}
							if(i === data.result.length){
								done();
							}
						});
					}
				}
				done();
				
			});
		});
	});
	

};