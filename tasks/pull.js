'use strict';
var ServiceNow = require('../services/snclient'),
	require_config = require("../helper/config_validator"),
	FileHelper = require("../helper/file_helper");
//	FileRecordUtil = require("../helper/file_record"),
//	FileRecord = FileRecordUtil.fileRecord,
//	makeHash = FileRecordUtil.makeHash;

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
		
				for(var i = 0; i < obj.result.length; i++){
					(function(){
						fileHelper.saveFile(obj.result[i]).then(function(){
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
};
