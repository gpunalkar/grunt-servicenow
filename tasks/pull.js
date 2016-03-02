'use strict';
var ServiceNow = require('../services/snclient'),
	require_config = require("../helper/config_validator"),
	require_folder = require("../helper/folder_validator"),
	FileRecordUtil = require("../helper/file_record"),
	FileRecord = FileRecordUtil.fileRecord,
	makeHash = FileRecordUtil.makeHash;

var fs = require('fs'),
	path = require('path');


module.exports = function (grunt) {
    grunt.registerTask('pull', 'Pull command.', function (folderName,file_name) {

        var done = this.async();
        require_config().then(function (config) {
            var destination = path.join(process.cwd(), "dist");
            require_folder(destination).then(function () {

                var snHelper = new ServiceNow(config);
				var query ="";
				
				if(file_name){
					query = config.folders[folderName].key + "=" + file_name;	
				}
				else{
					query = config.folders[folderName].key + "STARTSWITHsolution";
				}
				snHelper.table(config.folders[folderName].table).getRecords(query,function(err,obj){
					var folder_path = path.join(destination, folderName);
					
					require_folder(folder_path).then(function (){
						if(obj.result.length === 1){
							var result = obj.result[0];
							var content = result[config.folders[folderName].field];
							
							var filename = result[config.folders[folderName].key];
							
							if ('extension' in config.folders[folderName]) {
								filename = filename + "." + config.folders[folderName].extension;
							}
							
							var file_path = path.join(folder_path, filename);
							
							// instantiate file_record and create hash
							var fileRecord = new FileRecord(config, file_path);
							
							var record = {
								sys_id : result.sys_id,
								sys_updated_on : result.sys_updated_on,
								sys_updated_by : result.sys_updated_by
							};
							
							fileRecord.updateMeta(record);
							
							fileRecord.saveHash(content, function(saved){
								console.log("saved");
								done();
							})
							fs.writeFile(file_path, content, function (err) {
								if (err){
									console.error("Error writing new file", err)
								}
								else{
									console.log("Creating file " + file_path);
								}
								
								done();
							});
						}
						else{
							for(var i = 0; i < obj.result.length; i++){
								(function(){
									var content = obj.result[i][config.folders[folderName].field];
							
									var filename = obj.result[i][config.folders[folderName].key];

									if ('extension' in config.folders[folderName]) {
										filename = filename + "." + config.folders[folderName].extension;
									}

									var file_path = path.join(folder_path, filename);
									
									// instantiate file_record and create hash
									fs.writeFile(file_path, content, function (err) {
										if (err){
											console.error("Error writing new file", err)
										}
										else{
											console.log("Creating file " + file_path);
										}

										done();
									});
								})();
							}
						}
					});
				});
				
//                var query = "name" + "STARTSWITH" + 'solution';
//
//
//                var folder_path = path.join(destination, folderName);
//
//
//                if (!fs.existsSync(folder_path)) {
//                    fs.mkdirSync(folder_path);
//                }
//
//                snHelper.getRecords(config.folders[folderName].table, query).on("complete", function (data, response) {
//                    if (data.code === 'ECONNREFUSED') {
//                        console.log(data);
//                    }
//                    else {
//                        for (var i = 0; i < data.result.length; i++) {
//                            var content = data.result[i][config.folders[folderName].field];
//                            var filename = data.result[i].name;
//
//                            if ('extension' in config.folders[folderName]) {
//                                filename = filename + "." + config.folders[folderName].extension;
//                            }
//                            var file_path = path.join(folder_path, filename);
//                            fs.writeFile(file_path, content, function (err) {
//
//                                if (err) {
//                                    console.error("ERR", err);
//                                }
//                                else {
//                                    console.log("Touching file " + file_path);
//                                    // why is this showing only the second files name twice
//
//                                }
//                                if (i === data.result.length) {
//                                    done();
//                                }
//                            });
//                        }
//                    }
//                    done();
//
//                });
            });
        });
    });
};