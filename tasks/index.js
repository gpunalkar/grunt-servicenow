'use strict';
var path = require('path');

module.exports = function (grunt) {
    require('./init')(grunt);
    require('./pull')(grunt);
    require('./push')(grunt);
    require('./runserver')(grunt);

    grunt.event.on('watch', function (action, filepath) {
        grunt.config(['filechanged'], path.basename(filepath).replace(path.extname(filepath),""));
    });

    grunt.registerTask('set_config', 'Set a config property.', function(name, val) {
        grunt.config.set(name, val);
    });
};
