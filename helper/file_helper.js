var require_folder = require("../helper/folder_validator");

var path = require('path');
var fs = require('fs-extra')
module.exports = function(config,callback){
	this.config = config;
	this.folder_name = "";
	this.destination = "";
	
	
	return {
		saveFile : function(result){
			var _this = this;
			var p = new Promise(
				function(resolve, reject){
					var config_object = config.folders[_this.folder_name],
						content = result[config_object.field],
						filename = result[config_object.key];

					if ('extension' in config_object) {
						filename = filename + "." + config_object.extension;
					}

					var file_path = path.join(_this.destination, _this.folder_name, filename);

					fs.outputFile(file_path, content, function (err) {
						if (err){
							reject(err);
						}
						else{
							console.log("Creating file " + file_path);
							resolve();
						}
					});			
				}
			);
			
			return p;
			
			
		},
		
		setFolderName : function(folder_name){
			this.folder_name = folder_name;
		},		
		setDestination : function(dest){
			this.destination = path.join(process.cwd(),dest);
		}
	};
}