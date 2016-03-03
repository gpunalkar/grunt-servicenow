'use strict';
var fs = require('fs'),
    path = require('path'),
    ServiceNow = require('../services/snclient'),
    require_config = require("../helper/config_validator"),
    FileHelper = require("../helper/file_helper"),
    HashHelper = require('../helper/hash'),
    syncDataHelper = require('../helper/sync_data_validator'),
    destination = path.join(process.cwd(), "dist");


module.exports = function (grunt) {
    grunt.registerTask('pull', 'Pull command.', function (folder_name,file_name) {

        var done = this.async();
		syncDataHelper.loadData().then(function (sync_data) {
			require_config().then(function (config) {
				var hash = HashHelper(sync_data);
				var fileHelper = new FileHelper(config);
				fileHelper.setFolderName(folder_name);
				fileHelper.setDestination("dist");
				var snHelper = new ServiceNow(config);
				var query ="";

				if(file_name){
					query = config.folders[folder_name].key + "=" + file_name;	
				}
				else{
					query = config.folders[folder_name].key + "STARTSWITHsolution";
				}
				snHelper.table(config.folders[folder_name].table).getRecords(query,function(err,obj){
					var config_object = config.folders[folder_name];

					for(var i = 0; i < obj.result.length; i++){
						var result = obj.result[i];
						(function(){
							var file_name = result[config_object.key];
							
							if(config_object.extension){
								file_name = file_name + "." + config_object.extension;
							}
							
							var dest = path.join("dist", folder_name,file_name);
							
							var content = result[config_object.field];
							
							fileHelper.saveFile(
								{
									dest : dest,
									content : content
								}
							).then(function(){
								sync_data[dest] = {
									sys_id: result.sys_id,
									sys_updated_on: result.sys_updated_on,
									sys_updated_by: result.sys_updated_by,
									hash: hash.hashContent(content)
								};
								syncDataHelper.saveData(sync_data);
								done();
							},function(err){
								console.error("Save file failed", err);
								done();
							});
						})();

					}
				});
			});
		});

    });
};
