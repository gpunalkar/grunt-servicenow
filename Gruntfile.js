module.exports = function (grunt) {
    var snConfig = grunt.file.readJSON('.sn-config.json');
    var watchObj = {};

    for (key in snConfig.folders) {
        watchObj[key] = {
            files:['dist/'+key+'/*'],
            tasks: ['push:'+key+':<%= filechanged %>']
        };
    }

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        pull: snConfig.folders,
        push: snConfig.folders,
        watchAndPush: watchObj
    });

    grunt.event.on('watch', function (action, filepath) {
        grunt.config(['filechanged'], filepath);
    });

    grunt.loadNpmTasks('grunt-servicenow');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.task.renameTask("watch", "watchAndPush");

};