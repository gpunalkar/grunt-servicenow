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
                            name: 'Download',
                            value: 'download'
                        }
                    ]
                }, {
                    type: "input",
                    name: "filename",
                    message: "Updateset name?",
                    default: "RANDOM",
                    when: function (answer) {
                        return answer.action == 'new'
                    }
                }

            ];

            function generateName() {

                var today = new Date();
                return config.project_prefix + " - " + today.toISOString().substring(0, 10) + ' ' + today.getHours() + ':' + today.getMinutes();

            }

            function fetchUpdateset() {
                var ui = new BottomBar({bottomBar: loader[i % 4]});
                var interval = setInterval(function () {
                    ui.updateBottomBar(loader[i++ % 4]);
                }, 300);

                var obj = {
                    table: 'sys_update_set',
                    limit: 5,
                    order_by_desc: 'sys_created_on'
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
                if (answers.action == 'download') {
                    fetchUpdateset().then(function (choices) {
                        var question2 = [
                            {
                                type: "list",
                                name: "updateset",
                                message: "Please select the updateset",
                                choices: choices
                            }
                        ];

                        askQuestions(question2).then(function (answers) {
                            var sys_id = answers.updateset;
                            var url = config.protocol + '://' + config.host + '/nav_to.do?uri=sys_update_set.do?sys_id=' + sys_id;
                            console.log('Use the link bellow to download the updateset');
                            console.log(url);
                            done();
                        })
                    })

                } else {
                    if (answers.filename == 'RANDOM')
                        answers.filename = generateName();

                    snService.createRecord({
                        table: 'sys_update_set',
                        payload: {name: answers.filename}
                    }, function (err, obj) {
                        var url = config.protocol + '://' + config.host + '/nav_to.do?uri=sys_update_set.do&sys_id=' + obj.result.sys_id;
                        console.log('Updateset Created, now mark as current');
                        console.log(url);
                        done();
                    });
                }
            });
        });
    });
};
