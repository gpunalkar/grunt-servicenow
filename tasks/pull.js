'use strict';
var fs = require('fs'),
    path = require('path'),
    ServiceNow = require('../services/snclient'),
    require_config = require("../helper/config_validator"),
	fileHelper = require("../helper/file_helper"),
    HashHelper = require('../helper/hash'),
    syncDataHelper = require('../helper/sync_data_validator');


module.exports = function (grunt) {
    grunt.registerTask('pull', 'Pull command.', function (folder_name,file_name) {

        var done = this.async();
		var destination = path.join(process.cwd(), grunt.config('destination'));
		grunt.option.init([{

		}])
		syncDataHelper.loadData().then(function (sync_data) {
			require_config().then(function (config) {
				var prefix = grunt.config("pull_prefix");

				var hash = HashHelper(sync_data);

				var snHelper = new ServiceNow(config);
				var query ="";

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

								if(i === obj.result.length-1){
									resolve(files_to_save)
								}



							})();

						}
					});

					savePromise.then(function(files_to_save){

						fileHelper.saveFiles(files_to_save
							).then(function(){
								syncDataHelper.saveData(sync_data);
								done();
							},function(err){
								console.error("Save file failed", err);
								done();
							});

					});
				});
			});
		});

    });
};
