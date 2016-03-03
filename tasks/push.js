'use strict';
var ServiceNow = require('../services/snclient'),
	require_config = require("../helper/config_validator"),
	FileHelper = require("../helper/file_helper");

var fs = require('fs');
var path = require('path');

module.exports = function (grunt) {
    grunt.registerTask('push', 'Push command.', function (folder_name, file_name) {
     
		
		var done = this.async();
        require_config().then(function (config) {
            var fileHelper = new FileHelper(config);
            fileHelper.setFolderName(folder_name);
			fileHelper.setDestination("dist");
			
			var files = fileHelper.readFiles(file_name);

			var snHelper = new ServiceNow(config);

			files.then(function(all_files){
				for(var i = 0; i <all_files.length; i++){
					var record_name = path.basename(all_files[i].name);
					
					// I need to get the sys_id here
					var parms = {
						table : config.folders[folder_name].table,
						sys_id : "4e1a9d2f137d16002ea1b2566144b00a",
						payload : {
								"html" : all_files[i].content,
								"name" : record_name
							
						}
					};
					snHelper.table(parms.table).updateRecord(parms,function(err,obj){
						console.log(obj);
					});
					
				}
				
			});
		});
    });
};
