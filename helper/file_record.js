/*
 * This creates and manages a file record that hashes relevant information for a file. Tracks sys_id, updated, data to manage conflicts as well
 */

var fs = require('fs'),
	path = require('path');
	crypto = require('crypto');

var method = FileRecord.prototype,
	syncDir = '.sync_data';

function FileRecord(config, file){
	this.filePath = normalizePath(file);
	this.config = config;
	this.rootDir = this.getRoot();
	this.errorList = [];
	this.logger = config._logger;
	this.meta = {};
	
	this.setNewDiscoveredFile(false);
}

function makeHash(data) {
	var hash = crypto.createHash('md5').update(data).digest('hex');
	
	return hash;
}

// i think this matches the filename to the field value without the suffix
function getFieldMap(filename, map){
	var suffixes = Object.keys(map.fields);
	
	for(var i=0; i < suffixes.length; i++){
		var suffix = suffixes[i];
		var match = filename.match(new RegExp(suffix + '$'));
		
		if(match){
			var keyValue = filename.slice(0, match.index - 1);
			
			return {
				keyValue : keyValue,
				field : map.fields[suffix];
			};
		}
	}
	
	return null;
}

// fix windows path issues (windows can handle both '\' and '/' so be *nix friendly)
function normalizePath(p) {
    return p.replace(/\\/g, '/');
}

// ------------------------------
// fs methods
// ------------------------------

method.getFolderName = function(){
	return path.basename(path.dirname(this.filePath));
};

method.getFileName = function(){
	return path.basename(this.filePath);
};

method.getMetaFilePath = function(){
	var syncFileRelative = this.filePath.replace(this.rootDir, path.sep + syncDir);
	
	var hashFile = this.rootDir + syncFileRelative;
	
	return hashFile;
};

method.clearMetaFile = function(){
	var path = this.getMetaFilePath();
	
	fs.remove(path, function(err){
		if (err){
			console.error("Error clearing cache file...", err);
			callback(false);
		}
		else {
			callback(true);
		}
	})
};

method.getRoot = function(){
	if(this.rootDir){
		return this.rootDir;
	}
	
	var fileDir = path.dirname(this.filePath);
	var root = path.join(fileDir + "../");
	
	console.log("project root: " + root);
	return root;
}

method.vaildFile = function () {
	return this.getSyncMap();
};

method.errors = function () {
	if(this.errorList.length > 0){
		return this.errorList;
	}
	
	return false;
};

// ------------------------------
// meta map methods
// ------------------------------
method.getSyncMap = function(){
	var folder = this.getFolderName(),
		fileName = this.getFileName(),
		map = this.config.folders[folder];
	
	if(!map){
		return null;
	}
	
	var fieldMap = getFieldMap(fileName, map);
	
	if(!fieldMap){
		return null;
	}
	
	map.field = fieldMap.field;
	map.root = this.rootDir;
	
	this.syncMap = map;
	
	return map;
};

method.getMeta = function(){
	if(this.meta.syncHash){
		return this.meta;
	}
	
	var metaFilePath = this.getMetaFilePath(),
		fContents = '',
		metaObj;
	
	fs.readFile(metaFilePath,'utf-8',function(err,data){
		if (err){
			console.log(err);
			return false;
		}
		
		fContents = data;
		metaObj = JSON.parse(fContents);
		this.meta = metaObj;
		return metaObj;
		
	});
};

method.updateMeta = function(obj){
	var keys = Object.keys(obj);
	
	for(var k in keys){
		var key = keys[k];
		
		this.meta[key] = obj[key];
	};
	
	console.log('updated meta: ', this.meta);
};

method._saveMeta = function(callback) {
	var dataFile = this.getMetaFilePath(),
		outputString = JSON.stringify(this.meta),
		_this = this;
	
	fs.writeFile(dataFile, outputString, function(err){
		if (err){
			console.error("Could not write out meta file", dataFile);
			callback(false);
		}
		else{
			callback(true);
		}
	});
};

// ------------------------------
// hash methods
// ------------------------------
method.getLocalHash = function(){
	var metaData = this.getMeta();
	if(metaData){
		return metaData.syncHash;
	}
	console.warn("Sync Data does not exist yet");
	return '';
};

method.saveHash = function(data, callback){
	console.log("Saving meta/hash data for file: " + this.filePath);
	
	this.updateMeta({
		syncHash : makeHash(data);
	});
	
	this._saveMeta(callback);
}

// ------------------------------
// record methods
// ------------------------------
method.getRecordUrl = function() {
	var syncMap = this.getSyncMap(),
		root = syncMap.root,
		host = this.config.host,
		protocol = this.config.protocl ? this.config.protocol : 'https',
		meta = this.getMeta(),
		url = protocol + "://" + host + '/api/now/table/' + syncMap.table + "/" + meta.sys_id;
	
	url = url.replace(/\s/g,"%20");
	
	return url;
};

module.exports = {
	fileRecord :FileRecord,
	makeHash : makeHash
};

