'use strict';
var express = require('express'),
    require_config = require("../helper/config_validator"),
    restify = require('restify'),
    path = require('path');
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

            app.get('/api/*', function (req, res) {
                var auth = new Buffer(config.auth, 'base64').toString(),
                    parts = auth.split(':'),
                    user = parts[0],
                    pass = parts[1],
                    protocol = config.protocol;


                var clientOptions = {
                    url: protocol + '://' + config.host
                };

                try {
                    var client = restify.createJsonClient(clientOptions);
                    client.basicAuth(user, pass);
                } catch (err) {
                    console.log('Some error happend', err);
                }

                client.get(req.url, function (err, api_req, api_res, obj) {
                    res.send(api_res.body);
                });

            });

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

