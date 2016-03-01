module.exports = function (grunt) {
    var snConfig = grunt.file.readJSON('.sn-config.json');

    grunt.config(['pull', 'filechanged'], "");

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        pull: snConfig.folders,
        watch: {
            ui_scripts: {
                files: ['dist/ui_scripts/*'],
                tasks: ['pull:ui_script:<%= pull.filechanged %>']
            }
        }
    });
    grunt.event.on('watch', function (action, filepath) {
        grunt.config(['pull', 'filechanged'], filepath);
        //grunt.log.writeln("Watch called");
    });


    grunt.loadNpmTasks('grunt-servicenow');
    grunt.loadNpmTasks('grunt-contrib-watch');

};