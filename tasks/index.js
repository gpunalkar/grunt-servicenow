'use strict';

module.exports = function (grunt) {
    require('./init')(grunt);
    require('./pull')(grunt);
    require('./push')(grunt);
    require('./runserver')(grunt);


    grunt.registerTask('set_config', 'Set a config property.', function(name, val) {
        grunt.config.set(name, val);
    });
};
