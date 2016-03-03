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
    grunt.registerTask('pull', 'Pull command.', function (folder_name,file_name) {

        var done = this.async();
		var destination = path.join(process.cwd(), grunt.config('destination'));

		syncDataHelper.loadData().then(function (sync_data) {
			require_config().then(function (config) {
				var hash = HashHelper(sync_data);

				var snHelper = new ServiceNow(config);

				var pullRecords = function(folder_name){
					return new Promise(function(resolve,reject){

						var query = "",
							prefix = grunt.config.get("pull_prefix");

						if(file_name){
							query = config.folders[folder_name].key + "=" + file_name;
						}
						else if(prefix)
						{

							query = config.folders[folder_name].key + "STARTSWITH" + prefix;
						}
						snHelper.table(config.folders[folder_name].table).getRecords(query,function(err,obj){
							var config_object = config.folders[folder_name];

							var savePromise = new Promise(function(resolve,reject){
								var files_to_save = [];
								for(var i = 0; i < obj.result.length; i++){
									var result = obj.result[i];

									(function(){
										var file_name = result[config_object.key];

										if(config_object.extension){
											file_name = file_name + "." + config_object.extension;
										}

										var dest = path.join(destination, folder_name,file_name);

										var content = result[config_object.field];

										files_to_save[dest] = content;
										sync_data[dest] = {
											sys_id: result.sys_id,
											sys_updated_on: result.sys_updated_on,
											sys_updated_by: result.sys_updated_by,
											hash: hash.hashContent(content)
										};
										console.log(i + "=" + obj.result.length);
										if(i === obj.result.length-1){
											console.log("hash");
											resolve(files_to_save);
										}



									})();

								}
							});

							savePromise.then(function(files_to_save){
								console.log("hi");
								fileHelper.saveFiles(files_to_save
									).then(function(){
										syncDataHelper.saveData(sync_data);
										resolve();
									},function(err){
										console.error("Save file failed", err);
										done();
									});

							});
						});
					});

				}
				if(!folder_name && !file_name){

					var questions = [
						{
							type: "checkbox",
							name: "folders",
							message: "What record types do you want to pull from?",
							choices : Object.keys(config.folders)
						},
						{
							type: "confirm",
							name: "no_query",
							message: "Do you want to get all records for the selected types?"
						},
						{
							type: "input",
							name: "prefix",
							message: "Please enter a search term to use for finding records",
							when : function (answers){
								return (answers.no_query) ? false : true;
							}

						}
					];
					inquirer.prompt(questions, function (answers) {
						grunt.config.set("pull_prefix",answers.prefix);

						for(var i = 0; i < answers.folders.length; i++){

							pullRecords(answers.folders[i]).then(function(){
								if(i === answers.folders.length){
									done();
								}
							});

						}

					});

				}
				else{
					pullRecords(folder_name).then(function(){
						console.log("success");
						done();
					})
				}

			});
		});

    });
};
