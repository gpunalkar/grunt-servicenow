'use strict';

var fs = require('fs'),
    path = require('path'),
    inquirer = require('inquirer'),
    ServiceNow = require('../services/snclient'),
    require_config = require("../helper/config_validator"),
    fileHelper = require("../helper/file_helper"),
    HashHelper = require('../helper/hash'),
    syncDataHelper = require('../helper/sync_data_validator');


var askQuestions = function (config) {
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

module.exports = function (grunt) {
    grunt.registerTask('pull', 'Pull command.', function (folder_name, file_name) {
        var done = this.async();
        syncDataHelper.loadData().then(function (sync_data) {
            require_config().then(function (config) {
                var hash = HashHelper(sync_data);
                var snService = new ServiceNow(config);
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
                            obj.result.forEach(function (element) {
                                console.log(element);
                            });
                            //updateSyncData(obj, folder_name).then(function (files_to_save) {
                            //    fileHelper.saveFiles(files_to_save
                            //    ).then(function () {
                            //        syncDataHelper.saveData(sync_data);
                            //        resolve();
                            //    }, function (err) {
                            //        console.error("Save file failed", err);
                            //        reject(err);
                            //    });
                            //
                            //});
                        });
                    });

                };

                if (!folder_name && !file_name) {
                    askQuestions(config).then(function (answers) {
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
