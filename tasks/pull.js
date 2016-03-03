'use strict';
var ServiceNow = require('../services/snclient'),
	require_config = require("../helper/config_validator"),
	require_folder = require("../helper/folder_validator"),
	FileHelper = require("../helper/file_helper"),
	FileRecordUtil = require("../helper/file_record"),
	FileRecord = FileRecordUtil.fileRecord,
	makeHash = FileRecordUtil.makeHash;

var fs = require('fs'),
	path = require('path');


module.exports = function (grunt) {
    grunt.registerTask('pull', 'Pull command.', function (folder_name,file_name) {

        var done = this.async();
        require_config().then(function (config) {
			
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
		
				if(obj.result.length === 1){
					
					fileHelper.saveFile(obj.result[0]).then(function(){
						console.log("yay");
						done();
					},function(err){
						console.error("Save file failed", err);
						done();
					});
//					var result = obj.result[0];
//					var content = result[config.folders[folder_name].field];
//
//					var filename = result[config.folders[folder_name].key];
//
//					if ('extension' in config.folders[folder_name]) {
//						filename = filename + "." + config.folders[folder_name].extension;
//					}
//
//					var file_path = path.join(folder_path, filename);
//
//					// instantiate file_record and create hash
//					var fileRecord = new FileRecord(config, file_path);
//
//					fileRecord.updateMeta({
//						sys_id : result.sys_id,
//						sys_updated_on : result.sys_updated_on,
//						sys_updated_by : result.sys_updated_by
//					});
//
//					fileRecord.saveHash(content, function(saved){
//
//						fs.writeFile(file_path, content, function (err) {
//							if (err){
//								console.error("Error writing new file", err)
//							}
//							else{
//								console.log("Creating file " + file_path);
//							}
//
//							done();
//						});
//					});
				}
				else{
					for(var i = 0; i < obj.result.length; i++){
						(function(){
							result = obj.result[i];

							var content = result[config.folders[folder_name].field];

							var filename = result[config.folders[folder_name].key];

							if ('extension' in config.folders[folder_name]) {
								filename = filename + "." + config.folders[folder_name].extension;
							}

							var file_path = path.join(folder_path, filename);

							// instantiate file_record and create hash
							var fileRecord = new FileRecord(config, file_path);

							fileRecord.updateMeta({
								sys_id : result.sys_id,
								sys_updated_on : result.sys_updated_on,
								sys_updated_by : result.sys_updated_by
							});

							fileRecord.saveHash(content, function(saved){
								fs.writeFile(file_path, content, function (err) {
									if (err){
										console.error("Error writing new file", err)
									}
									else{
										console.log("Creating file " + file_path);
									}

								});
							});
						})();
					}
				}
            });
        });
    });
};