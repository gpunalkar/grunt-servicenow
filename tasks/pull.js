'use strict';
var fs = require('fs'),
    path = require('path'),
    inquirer = require('inquirer'),
    ServiceNow = require('../services/snclient'),
    require_config = require("../helper/config_validator"),
    fileHelper = require("../helper/file_helper"),
    HashHelper = require('../helper/hash'),
    syncDataHelper = require('../helper/sync_data_validator');


var makeDestination = function (dest) {
    return path.join(process.cwd(), dest);
};

var askQuestions = function () {
    return new Promise(function (resolve, reject) {
        var questions = [
            {
                type: "checkbox",
                name: "folders",
                message: "What record types do you want to pull from?",
                choices: Object.keys(_config.folders)

            }, {
                type: "input",
                name: "prefix",
                message: "Please enter a search term to use for finding records",
                default: _config.project_prefix
                //when : function (answers){
                //	return (answers.no_query) ? false : true;
                //}
            }
        ];
        inquirer.prompt(questions, function (answers) {
            resolve(answers);
        });

    });

};

var makeQuery = function (folder_name, file_name, prefix) {
    var query = "",
        key = _config.folders[folder_name].key;

    // if file name exists pull the specific file
    if (file_name) {
        query = key + "=" + _config.project_prefix + file_name;
    }
    // if prefix specified in pullLike or via prompt use STARTSWITH
    else if (prefix) {
        query = key + "STARTSWITH" + prefix;

    }
    // otherwise always use the prefix
    else {
        query = key + "STARTSWITH" + _config.project_prefix;
    }

    return query;
};

var updateSyncData = function (obj, folder_name) {

    return new Promise(function (resolve, reject) {
        var config_object = _config.folders[folder_name],
            files_to_save = [];

        for (var i = 0; i < obj.result.length; i++) {
            var result = obj.result[i],
                file_name = result[config_object.key];

            if (config_object.extension) {
                file_name = file_name + "." + config_object.extension;
            }

            var dest = path.join(destination, folder_name, file_name);

            var content = result[config_object.field];

            files_to_save[dest] = content;
            _sync_data[dest] = {
                sys_id: result.sys_id,
                sys_updated_on: result.sys_updated_on,
                sys_updated_by: result.sys_updated_by,
                hash: _hash.hashContent(content)
            };
            if (i === obj.result.length - 1) {
                resolve(files_to_save);
            }
        }
    });
};


module.exports = function (grunt) {
    grunt.registerTask('pull', 'Pull command.', function (folder_name, file_name) {
        var done = this.async();
        syncDataHelper.loadData().then(function (sync_data) {
            require_config().then(function (config) {
                var hash = HashHelper(sync_data);
                var snService = new ServiceNow(config);

                var pullRecords = function (folder_name, file_name, exact_filename) {
                    return new Promise(function (resolve, reject) {
                        var obj = {
                            table: config.folders[folder_name].table,
                            query: _query
                        };

                        snService.setup().getRecords(obj, function (err, obj) {
                            updateSyncData(obj, folder_name).then(function (files_to_save) {
                                fileHelper.saveFiles(files_to_save
                                ).then(function () {
                                    syncDataHelper.saveData(sync_data);
                                    resolve();
                                }, function (err) {
                                    console.error("Save file failed", err);
                                    reject(err);
                                });

                            });
                        });
                    });

                };
                
                if (!folder_name && !file_name) {
                    askQuestions().then(function (answers) {
                        var promises = [];
                        answers.folders.forEach(function (folder) {
                            promises.push(pullRecords(folder, answers.prefix, false));
                        });

                        Promise.all(promises).then(function () {
                            done();
                        });
                    });
                } else {
                    var file_name_or_prefix = file_name || config.project_prefix;
                    var exact_filename = false;
                    if (file_name) {
                        exact_filename = true;
                    }

                    pullRecords(folder_name, file_name_or_prefix, exact_filename).then(function () {
                        console.log('Done Pulling!');
                        done();
                    }, function (err) {
                        console.error("\nThere was a problem completing this for: " + folder_name + "\n", err);
                        done();
                    })
                }
            });
        }, function (err) {
            console.log("Problem loading sync data.");
        });

    });
};
