'use strict';

module.exports = function (grunt) {
    require('./pull')(grunt);
    require('./push')(grunt);
    require('./runserver')(grunt);
};