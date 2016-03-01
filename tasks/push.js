'use strict';

module.exports = function (grunt) {
    grunt.registerTask('push', 'Push command.', function (arg1, arg2) {
        grunt.log.writeln("Running push command", arg1, arg2);
    });
};