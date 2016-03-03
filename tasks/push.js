'use strict';
var fs = require('fs'),
	path = require('path');

var ServiceNow = require('../services/snclient'),
	require_config = require("../helper/config_validator"),
	fileHelper = require("../helper/file_helper"),
	HashHelper = require('../helper/hash'),
    syncDataHelper = require('../helper/sync_data_validator'),
    destination = path.join(process.cwd(), "dist");




module.exports = function (grunt) {
    grunt.registerTask('push', 'Push command.', function (folder_name, file_name) {

		var done = this.async();
		syncDataHelper.loadData().then(function (sync_data) {
			require_config().then(function (config) {

				var prefix = grunt.config("push_prefix"),
					destination = path.join(process.cwd(), grunt.config('destination')),
					full_name = path.join(destination,folder_name);


				if(prefix){
					prefix = prefix + "*";

					if(config.folders[folder_name].extension){

						prefix = prefix + "." + config.folders[folder_name].extension;
					}

				}
				else if(file_name){
					full_name = path.join(destination,file_name);
					if(config.folders[folder_name].extension){

						full_name = full_name + "." + config.folders[folder_name].extension;
					}
				}
				var files = fileHelper.readFiles(full_name,prefix),
					snHelper = new ServiceNow(config);


				files.then(function(all_files){
					for(var i = 0; i <all_files.length; i++){

						var record_name = path.basename(all_files[i].name),
							record_path = path.join(destination,folder_name,record_name),
							parms = {
								table : config.folders[folder_name].table,
								sys_id : sync_data[record_path].sys_id,
								payload : {
										"html" : all_files[i].content

								}
							};




						snHelper.table(parms.table).updateRecord(parms,function(err,obj){
							if(err){
								console.error("Error on updateRecord: ", err)
							}
							else{
								console.log("Record updated successfully",record_name);
							}
						});

					}

				});
			});
		});
    });
};
