'use strict';
var path = require('path');

module.exports = function (grunt) {
    require('./init')(grunt);
    require('./pull')(grunt);
    require('./push')(grunt);
    require('./runserver')(grunt);

    grunt.event.on('watch', function (action, filepath) {
        var file_name = path.basename(filepath).replace(path.extname(filepath),"");
        var folders = filepath.split(path.sep);
        folders.shift(); // pop /dist
        var folder_value = folders.shift(); // pop /folder passed as $folder
        if (folders.length >= 2 ) {
            folders.pop(); // pop /filename.ext
            folders.push(file_name);
            file_name = folders.join(path.sep);
        }
        grunt.config("filechanged", file_name);
        grunt.config("folder",folder_value);

    });

    grunt.registerTask('set_config', 'Set a config property.', function(name, val) {
        grunt.config.set(name, val);
    });
};
