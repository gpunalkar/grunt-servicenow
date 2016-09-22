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
    grunt.registerTask('pull', 'Pull command.', function (folder_name, file_name) {
        var done = this.async();
        var force_update = grunt.option('force') || grunt.config('force');

        syncDataHelper.loadData().then(function (sync_data) {
            require_config().then(function (config) {
                var hash = HashHelper(sync_data);
                var snService = new ServiceNow(config).setup();

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

                        snService.getRecords(obj, function (err, obj) {
                            var files_to_save = {},
                                files_different = {},
                                sync_data_different = {},
                                hashComparePromises = [],
                                files_content = {},
                                hashComparePromise,
                                filename,
                                file_path;
                            obj.result.forEach(function (element) {
                                (function () {
                                    function pullRecord(item) {
                                        var content = element[item.field];
                                        filename = element[config.folders[folder_name].key];
                                        file_path = path.join(folder_name, filename);
                                        if ('label' in item) {
                                            file_path = path.join(file_path, item.label);
                                        }
                                        if ('extension' in item) {
                                            file_path = file_path + "." + item.extension;
                                        }

                                        var dest = path.join(config.app_dir, file_path);

                                        files_content[dest] = content;

                                        hashComparePromise = hash.compareHash(dest);
                                        hashComparePromises.push(hashComparePromise);





                                        hashComparePromise.then(function (result) {
                                            if (result.same_hash) {
                                                files_to_save[result.dest] = files_content[result.dest];
                                                sync_data[result.dest] = {
                                                    sys_id: element.sys_id,
                                                    sys_updated_on: element.sys_updated_on,
                                                    sys_updated_by: element.sys_updated_by,
                                                    hash: hash.hashContent(files_content[result.dest])
                                                };
                                            } else {
                                                files_different[result.dest] = content;
                                                sync_data_different[result.dest] = {
                                                    sys_id: element.sys_id,
                                                    sys_updated_on: element.sys_updated_on,
                                                    sys_updated_by: element.sys_updated_by,
                                                    hash: hash.hashContent(content)
                                                };
                                            }
                                        });


                                    }

                                    var field = config.folders[folder_name];
                                    if (Array.isArray(field.field)) {
                                        field.field.forEach(function (item) {
                                            pullRecord(item);
                                        });
                                    } else {
                                        pullRecord(field);
                                    }
                                })();
                            });
                            Promise.all(hashComparePromises).then(function () {
                                if (Object.keys(files_different).length > 0) {
                                    console.log('You have mande changes to the following files.');
                                    for (var key in files_different) {
                                        console.log(" - " + key)
                                    }
                                    console.log('Do you want to overwrite your changes?');

                                    var questions = [{
                                        type: "confirm",
                                        name: "overwrite",
                                        message: "Do you want to overwrite your local changes??",
                                        default: false

                                    }];
                                    inquirer.prompt(questions, function (answers) {
                                        if (answers.overwrite) {
                                            files_to_save = util.mergeObject(files_to_save, files_different)
                                            sync_data = util.mergeObject(sync_data, sync_data_different);
                                        }
                                        fileHelper.saveFiles(files_to_save).then(function (files_saved) {
                                            resolve(files_saved);
                                        });
                                    });
                                } else {
                                    fileHelper.saveFiles(files_to_save).then(function (files_saved) {
                                        resolve(files_saved);
                                    });
                                }
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

                        Promise.all(promises).then(function (files_saved) {
                            console.log('Files saved: ');
                            files_saved.forEach(function (folder) {
                                folder.forEach(function (item) {
                                    console.log(' - ' + item);
                                });
                            });
                            syncDataHelper.saveData(sync_data).then(function () {
                                done();
                            });
                        });
                    });
                } else {
                    var file_name_or_prefix = file_name || config.project_prefix;
                    var exact_filename = false;
                    if (file_name) {
                        exact_filename = true;
                    }

                    pullRecords(folder_name, file_name_or_prefix, exact_filename).then(function (files_saved) {
                        console.log('Files saved: ');
                        files_saved.forEach(function (item) {
                            console.log(' - ' + item);
                        });
                        syncDataHelper.saveData(sync_data).then(function () {
                            done();
                        });
                    }, function (err) {
                        console.error("\nThere was a problem completing this for: " + folder_name + "\n", err);
                        done();
                    })
                }
            });
        });
    });
};
