var require_folder = require("../helper/folder_validator");

var path = require('path'),
	fs = require('fs-extra'),
	Promise = require('promise');
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
		readFiles : function(file_name){
			var _this = this;
			var all_files = [];
			if(file_name){
				all_files.push(file_name);
			}
			else{

				var p = new Promise(function(resolve, reject){
						fs.readdir(path.join(_this.destination, _this.folder_name),function(err, files){
							if(err){
								console.error("Error reading folder " + _this.folder_name,err);
								return false;
							}



							var readFiles = function(index){
								if(index === files.length){
									console.log("resolving");
									resolve(all_files);
								}
								else{
									read_name = path.join(_this.destination, _this.folder_name,files[index]);
									fs.readFile(read_name,"utf-8",function(err, data){
										all_files.push({
											name : read_name,
											content : data
										});
										readFiles(index+1);



									});
								}

							};

							readFiles(0);

						});
				});

				return p;

			}
		},
		
		setFolderName : function(folder_name){
			this.folder_name = folder_name;
		},		
		setDestination : function(dest){
			this.destination = path.join(process.cwd(),dest);
		}
	};
}
