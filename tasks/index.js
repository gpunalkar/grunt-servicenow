'use strict';
var path = require('path');

module.exports = function (grunt) {
    require('./init')(grunt);
    require('./pull')(grunt);
    require('./push')(grunt);
    require('./updateset')(grunt);
    require('./runserver')(grunt);

    var require_config = require("../helper/config_validator"),
        DESTINATION;


    require_config().then(function (config) {
        DESTINATION = config.app_dir;
    });

    grunt.event.on('watch', function (action, filepath) {
        grunt.config("filechanged", path.basename(filepath).replace(path.extname(filepath), ""));
        // grunt.config("folder",path.relative(path.join(process.cwd(),"dist"),path.dirname(filepath)));
        grunt.config("folder", path.relative(path.join(process.cwd(), DESTINATION), path.dirname(filepath)));

    });

    grunt.registerTask('set_config', 'Set a config property.', function (name, val) {
        grunt.config.set(name, val);
    });
};
