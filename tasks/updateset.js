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
    BottomBar = require('../lib/ui/bottom-bar'),
    DESTINATION;

module.exports = function (grunt) {
    grunt.registerTask('updateset', 'Updateset command.', function (folder_name, file_name) {
        var done = this.async();
        require_config().then(function (config) {
            var loader = [
                '/ Fetching',
                '| Fetching',
                '\\ Fetching',
                '- Fetching'
            ];
            var i = 4;
            var snService = new ServiceNow(config).setup();
            var updatesetList;
            var question1 = [
                {
                    type: "checkbox",
                    name: "action",
                    message: "What action do you want to run?",
                    choices: [
                        {
                            name: 'New',
                            value: 'new'
                        },
                        {
                            name: 'List',
                            value: 'list'
                        }
                    ]
                }
            ];
            var question3 = [
                {
                    type: "checkbox",
                    name: "action",
                    message: "What action do you want to run?",
                    choices: [
                        {
                            name: 'Make Current',
                            value: 'make_current'
                        },
                        {
                            name: 'Download',
                            value: 'download'
                        }
                    ]
                }
            ];

            function fetchUpdateset() {
                var ui = new BottomBar({bottomBar: loader[i % 4]});
                var interval = setInterval(function () {
                    ui.updateBottomBar(loader[i++ % 4]);
                }, 300);

                var obj = {
                    table: 'sys_update_set',
                    limit: 5
                };

                return new Promise(function (resolve, reject) {

                    snService.getRecords(obj, function (err, obj) {
                        var choices = [];

                        clearInterval(interval);
                        ui.updateBottomBar("");
                        obj.result.forEach(function (item) {
                            var tip = item.description.length > 30 ? item.description.substring(0, 30) + "..." : item.description;
                            choices.push({
                                name: item.name + ' - ' + tip,
                                value: item.sys_id
                            });
                        });
                        resolve(choices);
                    });
                });

            }

            function askQuestions(questions) {
                return new Promise(function (resolve, reject) {
                    inquirer.prompt(questions, function (answers) {
                        resolve(answers);
                    });
                });

            }

            askQuestions(question1).then(function (answers) {
                if (answers.action == 'list') {
                    fetchUpdateset().then(function (choices) {
                        var question2 = [
                            {
                                type: "checkbox",
                                name: "updateset",
                                message: "Please select the updateset",
                                choices: choices
                            }
                        ];

                        askQuestions(question2).then(function (answers) {
                            var sys_id = answers.updateset;

                            askQuestions(question3).then(function (answers) {
                                done();
                            });
                        })
                    })

                } else {
                    done();
                }
            });
        });
    });
};
