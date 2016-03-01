'use strict';
var ServiceNow = require('../services/snclient.js');
var require_config = require("../helper/config_validator");
var require_folder = require("../helper/folder_validator");

var fs = require('fs');
var path = require('path');

module.exports = function (grunt) {
    grunt.registerTask('pull', 'Pull command.', function (folderName) {

        var done = this.async();
        require_config().then(function (config) {
            var destination = path.join(process.cwd(), "dist");
            require_folder(destination).then(function () {

                console.log(grunt.config("test"));



                var snHelper = new ServiceNow(config);


                var query = "name" + "STARTSWITH" + 'solution';


                var folder_path = path.join(destination, folderName);


                if (!fs.existsSync(folder_path)) {
                    fs.mkdirSync(folder_path);
                }

                snHelper.getRecords(config.folders[folderName].table, query).on("complete", function (data, response) {
                    if (data.code === 'ECONNREFUSED') {
                        console.log(data);
                    }
                    else {
                        for (var i = 0; i < data.result.length; i++) {
                            var content = data.result[i][config.folders[folderName].field];
                            var filename = data.result[i].name;

                            if ('extension' in config.folders[folderName]) {
                                filename = filename + "." + config.folders[folderName].extension;
                            }
                            var file_path = path.join(folder_path, filename);
                            fs.writeFile(file_path, content, function (err) {

                                if (err) {
                                    console.error("ERR", err);
                                }
                                else {
                                    console.log("Touching file " + file_path);
                                    // why is this showing only the second files name twice

                                }
                                if (i === data.result.length) {
                                    done();
                                }
                            });
                        }
                    }
                    done();

                });
            });
        });
    });
};