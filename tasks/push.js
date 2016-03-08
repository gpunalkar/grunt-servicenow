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


        var getRecord = function (new_file) {

            return new Promise(function (resolve, reject) {
                // check if file is on server
                var file_name = path.basename(new_files.file_name),
                    config_folder = _config.folders[new_file.folder_name],
                    getQuery = config_folder.key + "=" + file_name,
                    queryObj = {
                        table: config_folder.table,
                        query: getQuery
                    };
                console.log(getQuery);
                snService.getRecords(queryObj, function (err, obj) {
                    if (err) {
                        console.log("Error getting records: ", err);
                        reject(err);
                    }
                    else if (obj.result.length === 0) {

                        new_file.table = config_folder.table;
                        new_file.key = config_folder.key;
                        new_file.field = config_folder.field;
                        new_file.extension = config_folder.extension;

                        resolve(new_file);
                    }
                    else {
                        console.log("record exists");
                    }

                });
            })
        };

        var createRecords = function (records) {
            return new Promise(function (resolve, reject) {
                var counter = 0;
                for (var i = 0; i < records.length; i++) {
                    (function (index) {
                        var payload = {};
                        payload[records[index].key] = path.basename(records[index].file_name, "." + records[i].extension);
                        payload[records[index].field] = records[index].content;

                        var postObj = {
                            table: records[index].table,
                            payload: payload
                        };

                        snService.createRecord(postObj, function (err, result) {
                            counter++;
                            updateSyncData(records[index].file_name, result, records[index].field)

                            if (counter === records.length) {
                                resolve();
                            }
                        })

                    }(i));

                }
            });
        };

        var askToCreateNewFiles = function () {
            (function () {
                return new Promise(function (resolve, reject) {
                    var files = [];
                    var counter = 0;
                    for (var i = 0; i < new_files.length; i++) {

                        (function (index) {
                            getRecord(new_files[index]).then(function (new_file) {
                                counter++;
                                files.push(new_file);
                                if (counter === new_files.length) {
                                    resolve(files);
                                }
                            });

                        }(i));

                    }
                });
            }()).then(function (files) {

                inquirer.prompt([{
                    type: "checkbox",
                    name: "records",
                    message: "The following files do not have records on the instance. Select which ones you want to create",
                    choices: files.map(function (d) {
                        return {name: path.basename(d["file_name"]), value: d}
                    }),
                    default: true

                }], function (answers) {
                    createRecords(answers.records).then(function () {
                        syncDataHelper.saveData(_sync_data);
                    });

                });
            });
        };

        function updateSyncData(record, obj, content_field) {
            var parms = {
                sys_id: obj.result.sys_id,
                sys_updated_on: obj.result.sys_created_on,
                sys_updated_by: obj.result.sys_created_by,
                hash: hash.hashContent(obj.result[content_field])
            };
            _sync_data[record] = parms;

        }

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
                                        currentPromise,
                                        sync_data_update = {};

                                    (function () {
                                        all_files.forEach(function (file_obj) {
                                            var record_path = path.join(DESTINATION, foldername, file_obj.name);
                                            if (record_path in sync_data) {
                                                currentPromise = hash.compareHashRemote(record_path, foldername, config);
                                                currentPromise.then(function (sameHash) {
                                                    if (sameHash) {
                                                        console.log('File ' + file_obj.name + ' hasnt changed', record_path);
                                                        filesToSave[record_path] = file_obj.content;
                                                        sync_data_update[record_path] = sync_data[record_path];
                                                        sync_data_update[record_path].hash = hash.hashContent(file_obj.content);
                                                    } else {
                                                        console.log('File ' + file_obj.name + ' changed');
                                                        filesChanged.push(file_obj);

                                                    }
                                                });
                                                promiseList.push(currentPromise);
                                            } else {
                                                console.log('No local record for file ' + file_obj.name);
                                                newFiles.push(file_obj);
                                            }
                                        });
                                    })();

                                    // Done comparing the hashes
                                    Promise.all(promiseList).then(function () {
                                        promiseList = [];

                                        var fileObj,
                                            payload;
                                        for (var path in filesToSave) {
                                            fileObj = {};
                                            payload = {};

                                            payload[config.folders[folder_name].field] = filesToSave[path];

                                            fileObj = {
                                                table: config.folders[foldername].table,
                                                sys_id : sync_data[path].sys_id,
                                                postObj : payload,
                                            };
                                            promiseList.push(updateRecord(fileObj));
                                        }

                                        // Done updating records
                                        Promise.all(promiseList).then(function () {
                                            resolve();
                                            console.log('done pushing')
                                        });
                                        //sevicenowpush
                                        // Push doesn't save files, it PUSHES!
                                        //fileHelper.saveFiles(filesToSave).then(function () {
                                        //util.mergeObject(sync_data_update, sync_data);
                                        //syncDataHelper.saveData(sync_data).then(function () {
                                        //    resolve();
                                        //});
                                        //});
                                    });

                                });
                            }
                        );
                    };

                    if (!folder_name && !file_name) {
                        askQuestions().then(function (answers) {
                            var promises = [];
                            answers.folders.forEach(function (folder) {
                                promises.push(pushRecords(folder, answers.filename));
                            });

                            Promise.all(promises).then(function () {
                                //askToCreateNewFiles();
                                done();
                            });
                        });

                    } else {
                        pushRecords(folder_name, file_name).then(function () {
                            //askToCreateNewFiles().then(function () {
                            done();
                            //})
                        });
                    }
                });
            }
        );
    });
};
