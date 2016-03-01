'use strict';

var express = require('express');

module.exports = function (grunt) {
    grunt.registerTask('runserver', 'My "runserver" task.', function () {
        var done = this.async();
        grunt.log.writeln('Processing task...');

        var app = express();
        app.listen(8000, function () {
            console.log('App listening on port 8000!');
        });
    });
};

