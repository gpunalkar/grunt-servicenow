'use strict';
var ServiceNow = require('../services/snclient.js');
var require_config = require("../helper/config_validator");
var require_folder = require("../helper/folder_validator");

var fs = require('fs');
var path = require('path');

module.exports = function (grunt) {
    grunt.registerTask('push', 'Push command.', function (folderName, fileName) {
     
		
		var done = this.async();
        require_config().then(function (config) {
            var destination = path.join(process.cwd(), "dist");
			
            require_folder(destination).then(function () {
				
				// setup SN client
				var snHelper = new ServiceNow(config),
				
					folder_path = path.join(destination, folderName),
					file_path = path.join(folder_path, fileName);
				console.log(file_path);
				fs.readFile(file_path,'utf-8',function(err, data){
					if(err){
//						console.log(err);
					}
					
					var parms = {
						table : config.folders[folderName].table,
						payload : {
								"html" : data,
								"name" : "steve"
							
						}
					};
					snHelper.table(config.folders[folderName].table).updateRecord(parms,function(err,obj){
						if(err){
							console.error("Error: ",err);
							done();
						}
						
						else{
							console.log("Changes to  " + file_path + " successfully update on instance.");	
							done();
						}
					});
					
				});
				
			});
		});
    });
};