'use strict';
var fs = require('fs'),
	path = require('path'),

	inquirer = require('inquirer'),
	ServiceNow = require('../services/snclient'),
	require_config = require("../helper/config_validator"),
	fileHelper = require("../helper/file_helper"),
	HashHelper = require('../helper/hash'),
    syncDataHelper = require('../helper/sync_data_validator');




module.exports = function (grunt) {
    grunt.registerTask('push', 'Push command.', function (folder_name, file_name) {

		var done = this.async();
		syncDataHelper.loadData().then(function (sync_data) {
			require_config().then(function (config) {
				var snHelper = new ServiceNow(config);

				var pushRecords = function(folder_name){
					return new Promise(function(resolve, reject){
						var destination = path.join(process.cwd(), grunt.config('destination')),
							full_name = path.join(destination,folder_name),
							prefix = "";



						if(file_name){
							full_name = path.join(full_name,file_name);
							if(config.folders[folder_name].extension){

								full_name = full_name + "." + config.folders[folder_name].extension;
							}
						}
						else if(grunt.config("push_prefix")){
							prefix = grunt.config("push_prefix") + "*";

							if(config.folders[folder_name].extension){

								prefix = prefix + "." + config.folders[folder_name].extension;
							}
						}
						else{
							prefix = "*";
						}


						var files = fileHelper.readFiles(full_name,prefix);

						files.then(function(all_files){
							for(var i = 0; i <all_files.
								length; i++){
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

								if(i === all_files.length){
									resolve();
								}

							}

						});
					});

				};

				if(!folder_name && !file_name){

					var questions = [
						{
							type: "checkbox",
							name: "folders",
							message: "What folders do you want to push to your instance?",
							choices : Object.keys(config.folders)
						},
						{
							type: "confirm",
							name: "no_query",
							message: "Do you want to push all files for the selected folders?"
						},
						{
							type: "input",
							name: "prefix",
							message: "Please enter a search term to use for finding files",
							when : function (answers){
								return (answers.no_query) ? false : true;
							}

						}
					];
					inquirer.prompt(questions, function (answers) {
						grunt.config.set("push_prefix",answers.prefix);

						for(var i = 0; i < answers.folders.length; i++){
							pushRecords(answers.folders[i]).then(function(){
								if(i === answers.folders.length){
									done();
								}
							});

						}

					});

				}
				else{
					pushRecords(folder_name).then(function(){
						console.log("done");
						done();
					});
				}
			});
		});
    });
};
