'use strict';
var fs = require('fs'),
    path = require('path'),
    inquirer = require('inquirer'),
    ServiceNow = require('../services/snclient'),
    require_config = require("../helper/config_validator"),
    fileHelper = require("../helper/file_helper"),
    HashHelper = require('../helper/hash'),
    util = require('../helper/util'),
    syncDataHelper = require('../helper/sync_data_validator'),
    DESTINATION = require('../config/constant').DESTINATION;


module.exports = function (grunt) {
    grunt.registerTask('push', 'Push command.', function (folder_name, file_name) {
        var done = this.async();
        var force = false;

        var insert_new_files = grunt.option('new') || grunt.config('new');
        var force_update = grunt.option('new') || grunt.config('new');

        syncDataHelper.loadData().then(function (sync_data) {
            require_config().then(function (config) {
                var hash = HashHelper(sync_data);
                var snService = new ServiceNow(config).setup();

                var updateRecord = function (parms) {
                    return new Promise(function (resolve, reject) {
                        snService.updateRecord(parms, function (err, obj) {
                            if (err) {
                                console.error("Error on updateRecord: ", err)
                                reject(err);
                            }
                            else {
                                resolve();
                            }
                        });
                    });
                };

                var askQuestions = function () {
                    return new Promise(function (resolve, reject) {
                        var questions = [
                            {
                                type: "checkbox",
                                name: "folders",
                                message: "What folders do you want to push to your instance?",
                                choices: Object.keys(config.folders)
                            },
                            {
                                type: "confirm",
                                name: "no_query",
                                message: "Do you want to push all files for the selected folders?"
                            },
                            {
                                type: "input",
                                name: "filename",
                                message: "Please enter a search term to use for finding files",
                                when: function (answers) {
                                    return (answers.no_query) ? false : true;
                                }

                            }
                        ];
                        inquirer.prompt(questions, function (answers) {
                            resolve(answers);
                        });

                    });
                };

                var pushRecords = function (foldername, filename) {
                    return new Promise(function (resolve, reject) {
                        if (filename) {
                            if (config.folders[folder_name].extension) {
                                filename = filename + "." + config.folders[foldername].extension;
                            }
                        }

                        fileHelper.readFiles(foldername, filename).then(function (all_files) {
                            var filesChanged = [],
                                filesToSave = {},
                                newFiles = [],
                                promiseList = [],
                                currentPromise;

                            all_files.forEach(function (file_obj) {
                                (function () {
                                    var record_path = path.join(DESTINATION, foldername, file_obj.name);
                                    if (record_path in sync_data) {
                                        currentPromise = hash.compareHashRemote(record_path, foldername, config);
                                        currentPromise.then(function (sameHash) {
                                            if (sameHash || force_update) {
                                                console.log('File ' + file_obj.name + ' hasnt changed', record_path);
                                                filesToSave[record_path] = file_obj.content;
                                            } else {
                                                console.log('File ' + file_obj.name + ' changed');
                                                filesChanged.push(file_obj);
                                            }
                                        });
                                        promiseList.push(currentPromise);
                                    } else {
                                        console.log('No local record for file ', record_path);
                                        newFiles.push(file_obj);
                                    }
                                })();
                            });

                            // Done comparing the hashes
                            Promise.all(promiseList).then(function () {
                                promiseList = [];
                                var fileObj,
                                    payload,
                                    servicePromise;

                                var insertOrUpdate = function (fileList, path, fileObj, insert) {
                                    if (insert) {
                                        servicePromise = insertRecord(fileObj);
                                    } else {
                                        servicePromise = updateRecord(fileObj);
                                    }
                                    servicePromise.then(function () {
                                        sync_data[path]["hash"] = hash.hashContent(fileList[path]);
                                    }, function (e) {
                                        console.log('ERROR', e);
                                    });
                                    promiseList.push(servicePromise);
                                };


                                for (var path in filesToSave) {
                                    payload = {};
                                    payload[config.folders[foldername].field] = filesToSave[file_path];

                                    fileObj = {
                                        table: config.folders[foldername].table,
                                        sys_id: sync_data[file_path].sys_id,
                                        payload: payload
                                    };

                                    insertOrUpdate(filesToSave, path, fileObj, false);
                                }

                                if (insert_new_files) {
                                    for (var path in newFiles) {
                                        payload = {};
                                        payload[config.folders[foldername].field] = filesToSave[file_path];

                                        fileObj = {
                                            table: config.folders[foldername].table,
                                            //sys_id: sync_data[file_path].sys_id,
                                            payload: payload
                                        };

                                        insertOrUpdate(filesToSave, path, fileObj, true);
                                    }
                                }


                                // Done updating records
                                Promise.all(promiseList).then(function () {
                                    resolve();
                                });
                            });

                        }, function () {
                            resolve();
                        });
                    });
                };

                if (!folder_name && !file_name) {
                    askQuestions().then(function (answers) {
                        var promises = [];
                        answers.folders.forEach(function (folder) {
                            promises.push(pushRecords(folder, answers.filename));
                        });

                        Promise.all(promises).then(function () {
                            syncDataHelper.saveData(sync_data).then(function () {
                                console.log('Completed');
                                done();
                            });
                        });
                    });

                } else {
                    pushRecords(folder_name, file_name).then(function () {
                        syncDataHelper.saveData(sync_data).then(function () {
                            console.log('Completed');
                            done();
                        });
                    });
                }
            });
        });
    });
};
