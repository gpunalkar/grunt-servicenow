'use strict';
var express = require('express'),
    require_config = require("../helper/config_validator"),
    restify = require('restify')

module.exports = function (grunt) {
    grunt.registerTask('runserver', 'My "runserver" task.', function (port) {
        var done = this.async();

        if (typeof port === "undefined") {
            port = 3000
        }

        var app = express();

        app.get('/api/*', function (req, res) {
            require_config().then(function (config) {

                var auth = new Buffer(config.auth, 'base64').toString(),
                    parts = auth.split(':'),
                    user = parts[0],
                    pass = parts[1],
                    protocol = config.protocol


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
};

