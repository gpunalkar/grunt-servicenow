'use strict';
var require_config = require("../helper/config_validator");


module.exports = function (grunt) {
    grunt.registerTask('pull', 'Pull command.', function () {
        var done = this.async();
        require_config().then(function (config) {
            grunt.log.writeln("Config file loaded");
            done();
        })
    });
};