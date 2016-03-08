'use strict';

var fs = require('fs'),
    path = require('path'),
    inquirer = require('inquirer'),
    ServiceNow = require('../services/snclient'),
    require_config = require("../helper/config_validator"),
    fileHelper = require("../helper/file_helper"),
    HashHelper = require('../helper/hash'),
    syncDataHelper = require('../helper/sync_data_validator'),
    DESTINATION = 'dist';

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
}


module.exports = function (grunt) {
    grunt.registerTask('pull', 'Pull command.', function (folder_name, file_name) {
        var done = this.async();
        syncDataHelper.loadData().then(function (sync_data) {
            require_config().then(function (config) {
                var hash = HashHelper(sync_data);
                var snService = new ServiceNow(config);

                var askQuestions = function () {
                    return new Promise(function (resolve, reject) {
                        var questions = [
                            {
                                type: "checkbox",
                                name: "folders",
                                message: "What record types do you want to pull from?",
                                choices: Object.keys(config.folders)

                            }, {
                                type: "input",
                                name: "prefix",
                                message: "Please enter a search term to use for finding records",
                                default: config.project_prefix
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

                var pullRecords = function (folder_name, file_name, exact_filename) {
                    return new Promise(function (resolve, reject) {
                        var operator = "STARTSWITH";
                        if (exact_filename) {
                            operator = "=";
                        }

                        var obj = {
                            table: config.folders[folder_name].table,
                            query: config.folders[folder_name].key + operator + file_name
                        };

                        snService.setup().getRecords(obj, function (err, obj) {
                            var files_to_save = {},
                                files_different = [],
                                hashComparePromises = [],
                                hashComparePromise,
                                content,
                                filename,
                                file_path,
                                dest;
                            obj.result.forEach(function (element) {
                                content = element[config.folders[folder_name].field];
                                filename = element.name;
                                file_path = path.join(folder_name, filename);

                                if ('extension' in config.folders[folder_name]) {
                                    file_path = file_path + "." + config.folders[folder_name].extension;
                                }
                                dest = path.join(DESTINATION, file_path);

                                hashComparePromise = hash.compareHash(file_path);
                                hashComparePromises.push(hashComparePromise);

                                hashComparePromise.then(function () {
                                    console.log('Hash compare success');
                                    files_to_save[dest] = content;
                                    sync_data[file_path] = {
                                        sys_id: element.sys_id,
                                        sys_updated_on: element.sys_updated_on,
                                        sys_updated_by: element.sys_updated_by,
                                        hash: hash.hashContent(content)
                                    };
                                })


                            });
                            Promise.all(hashComparePromises).then(function (values) {
                                console.log('Hash compare all');
                                fileHelper.saveFiles(files_to_save).then(function () {
                                    syncDataHelper.saveData(sync_data);  // We need to validate that per file base
                                    resolve();
                                });
                            }, function (err) {
                                console.log('Error here', err);
                                fileHelper.saveFiles(files_to_save).then(function () {
                                    syncDataHelper.saveData(sync_data);  // We need to validate that per file base
                                    resolve();
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
                            console.log('All promises done!');
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
