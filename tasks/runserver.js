'use strict';
var express = require('express'),
    require_config = require("../helper/config_validator"),
    restler = require('restler'),
    snClient = require('../services/snclient.js'),
    path = require('path'),
    bodyParser = require('body-parser');

var DEFAULT_MAP_EXTENSION = [
    {
        from: ".do",
        to: ".xhtml"
    }
];

module.exports = function (grunt) {
    grunt.registerTask('runserver', 'My "runserver" task.', function (port) {
        var done = this.async();

        if (typeof port === "undefined") {
            port = 3000
        }

        require_config().then(function (config) {
            var map_extension = config.map_extension || DEFAULT_MAP_EXTENSION;
            var app = express();

            app.use( bodyParser.json() );       // to support JSON-encoded bodies


            /**
             * Api
             */
            try {
                var snService = new snClient(config).setup();
            } catch (err) {
                console.log('Some error happend', err);
            }
            app.post('/api/*', function(req, res){
                snService.post(req.url,req.body, function(result){
                    res.send(result);
                });
            });

            app.put('/api/*', function(req, res){
                snService.put(req.url,req.body, function(result){
                    res.send(result);
                });
            });

            app.get('/api/*', function (req, res) {
                snService.get(req.url, function (result) {
                    res.send(result);
                });
            });
            /**
             * Api.end
             */


            app.get(/^\/(?!api).*/i, function (req, res, next) {
                map_extension.forEach(function (ext_map) {
                    if (path.extname(req.path) == ext_map.from) {
                        var filename = path.basename(req.path, path.extname(req.path)) + ext_map.to;
                        var url = path.join(path.dirname(req.path), filename);
                        res.redirect(url);
                    }
                });
                next();
            });

            app.use(express.static('dist'));
            app.use(express.static('dist/images'));
            app.use(express.static("node_modules"));
            app.use(express.static("bower_components"));
            app.use(express.static("."));
            app.listen(port, function () {
                grunt.log.writeln('App listening on port ' + port + '!');
            });

            process.on('uncaughtException', function (err) {
                if (err.errno === 'EADDRINUSE')
                    grunt.log.writeln("Port " + port + " already in use.");
                else
                    trow(err);
                process.exit(1);
            });
        });
    });
};

