module.exports = function (grunt) {

    //var snConfig = grunt.file.readJSON('.sn-config.json');
    //var watchObj = {};
    //for (key in snConfig.folders) {
    //    watchObj[key] = {
    //        files: ['dist/' + key + '/*'],
    //        tasks: ['push:' + key + ':<%= filechanged %>']
    //    };
    //}

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'), //This allows us to refer to the values of properties within our package.json file. e.g. <%= pkg.name %>
        //watch: watchObj
    });

    grunt.loadNpmTasks('grunt-servicenow');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.registerTask('new', ["set_config:new:true", 'push:ui_scripts']);

};
