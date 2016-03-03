'use strict';
var ServiceNow = require('../services/snclient'),
    require_config = require("../helper/config_validator"),
    require_folder = require("../helper/folder_validator"),
    HashHelper = require('../helper/hash'),
    syncDataHelper = require('../helper/sync_data_validator'),
    fs = require('fs'),
    path = require('path');


module.exports = function (grunt) {

    grunt.registerTask('pull', 'Pull command.', function (folderName, file_name) {
        var done = this.async();
        syncDataHelper.loadData().then(function (sync_data) {
            var hash = HashHelper(sync_data);
            require_config().then(function (config) {
                var destination = path.join(process.cwd(), "dist");
                require_folder(destination).then(function () {

                    var snHelper = new ServiceNow(config);
                    var query = "";

                    // TODO STARTSWITH is part of servicenow api and should happen on snclient
                    if (file_name) {
                        query = config.folders[folderName].key + "=" + file_name;
                    }
                    else {
                        query = config.folders[folderName].key + "STARTSWITHsolution";
                    }
                    snHelper.table(config.folders[folderName].table).getRecords(query, function (err, obj) {
                        var folder_path = path.join(destination, folderName);
                        require_folder(folder_path).then(function () {
                            obj.result.forEach(function (result, index) {
                                (function () {
                                    var content = result[config.folders[folderName].field];
                                    var filename = result[config.folders[folderName].key];

                                    if ('extension' in config.folders[folderName]) {
                                        filename = filename + "." + config.folders[folderName].extension;
                                    }

                                    var file_path = path.join(folder_path, filename);
                                    fs.writeFile(file_path, content, function (err) {
                                        if (err) {
                                            console.error("Error writing new file", err)
                                        }
                                        else {
                                            console.log("Creating file " + file_path);
                                            sync_data[file_path] = {
                                                sys_id: result.sys_id,
                                                sys_updated_on: result.sys_updated_on,
                                                sys_updated_by: result.sys_updated_by,
                                                hash: hash.hashContent(content)
                                            };
                                        }
                                    });
                                })();
                            });
                            syncDataHelper.saveData(sync_data);
                        });
                    });
                });
            });
        });

    });
};