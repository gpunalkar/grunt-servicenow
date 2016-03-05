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
		var _config = {},
			done = this.async();

		var prompt = function(){
			return new Promise(function(resolve,reject){
				var questions = [
					{
						type: "checkbox",
						name: "folders",
						message: "What folders do you want to push to your instance?",
						choices : Object.keys(_config.folders)
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
					resolve(answers);
				});

			});

		};


		syncDataHelper.loadData().then(function (sync_data) {

			require_config().then(function (config) {
				var snHelper = new ServiceNow(config).setup();
				_config = config;

				var pushRecords = function(folder_name){
					return new Promise(function(resolve, reject){
						var destination = path.join(process.cwd(), grunt.config("destination")),
							full_name = path.join(destination,folder_name),
							prefix = "";



						if(file_name){
							file_name = config.project_prefix + file_name;
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
							prefix = config.project_prefix + "*";
						}

						var files = fileHelper.readFiles(full_name,prefix);


						files.then(function(all_files){
							var count = 0;
							for(var i = 0; i <all_files.
								length; i++){

								(function(){
									var record_name = path.basename(all_files[i].name),
										payload = {},
										record_path = path.join(destination,folder_name,record_name),
										parms = {
											table : config.folders[folder_name].table,
											sys_id : sync_data[record_path].sys_id,
											payload : payload
										};
									payload[config.folders[folder_name].field] = all_files[i].content;

									snHelper.updateRecord(parms,function(err,obj){

										if(err){
											console.error("Error on updateRecord: ", err)
											reject(err);
										}
										else{
											count++;
											console.log("Record updated successfully",record_name);

											if(count === all_files.length){
												resolve();
											}
										}

									});
								})();
							}

						});
					});

				};

				if(!folder_name && !file_name){

					prompt().then(function (answers) {
						grunt.config.set("push_prefix",answers.prefix);

						var count = 0;
						for(var i = 0; i < answers.folders.length; i++){
							(function(){
								pushRecords(answers.folders[i]).then(function(){
									count++;

									if(count === answers.folders.length){

										done();
									}
								});
							})();


						}

					});

				}
				else{
					pushRecords(folder_name).then(function(){
						done();
					});
				}
			});
		});
    });
};
