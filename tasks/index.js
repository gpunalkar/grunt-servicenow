'use strict';

module.exports = function (grunt) {
    require('./init')(grunt);
    require('./pull')(grunt);
    require('./push')(grunt);
    require('./runserver')(grunt);
};
