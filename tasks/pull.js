'use strict';
var require_config = require("../helper/config_validator");


module.exports = function (grunt) {
    grunt.registerTask('pull', 'Pull command.', function (arg1, arg2) {
        grunt.log.writeln("Pulled", arg1, arg2);
        var done = this.async();
        require_config().then(function (config) {
            grunt.log.writeln("Config file loaded", arg1,arg2);
            done();
        })
    });
};