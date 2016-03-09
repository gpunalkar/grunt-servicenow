module.exports = function (grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'), //This allows us to refer to the values of properties within our package.json file. e.g. <%= pkg.name %>
        watch: {
            ui_scripts: {
                files: ['dist/ui_scripts/*'],
                tasks: ['push:ui_scripts:<%= filechanged %>']
            }
        }
    });



    grunt.loadNpmTasks('grunt-servicenow');
    grunt.loadNpmTasks('grunt-contrib-watch');
    //grunt.registerTask('new', ["set_config:new:true", 'push:ui_scripts']); // Hack

};
