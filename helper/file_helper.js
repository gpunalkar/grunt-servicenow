var path = require('path'),
    fs = require('fs-extra'),
    glob = require('glob'),
    current_path = process.cwd(),
    DESTINATION = require('../config/constant').DESTINATION;


module.exports = function () {

    var readDir = function (dir_path) {
        var all_files = [];
        return new Promise(function (resolve, reject) {
            glob(dir_path, function (err, files) {
                if (err) {
                    console.error("Error reading folder " + files, err);
                    return reject(err)
                }
                var promisesCreated = [];

                files.forEach(function (file_name) {
                    promisesCreated.push(fs.readFile(file_name, "utf-8", function (err, data) {
                        all_files.push({
                            name: path.basename(file_name),
                            content: data
                        });
                    }));

                    Promise.all(promisesCreated).then(function(){
                        resolve(all_files);
                    });
                });

            });
        });
    };

    var readFile = function (file_path) {
        var all_files = [];
        return new Promise(function (resolve, reject) {
            fs.readFile(file_path, "utf-8", function (err, data) {
                if (err) {
                    return reject()
                }
//                num_of_files_loaded++;
                all_files.push({
                    name: path.basename(file_path),
                    content: data
                });

//                if (num_of_files_loaded >= num_of_files) {
                resolve(all_files);
//                }
            });
        });

    };

    var saveFile = function (file_path, file_content) {
        var _this = this;
        return new Promise(
            function (resolve, reject) {
                fs.outputFile(file_path, file_content, function (err) {
                    if (err) {
                        reject(err);
                    } else {
                        console.log("Creating file " + file_path);
                        resolve();
                    }
                });
            }
        );

    };


    /**
     *
     * @param files_to_create
     * {
     *  "path/to/file_to_be_created" : "File Content Here"
     * }
     * @returns Promise
     */
    this.saveFiles = function (files_to_create) {
        return new Promise(function (resolve, reject) {
            var total_files = Object.keys(files_to_create).length;
            var files_created = 0;
            for (file_path in files_to_create) {
                saveFile(file_path, files_to_create[file_path]).then(function () {
                    files_created++;
                    if (files_created >= total_files) {
                        resolve();
                    }
                })
            }
        });
    };

    /**
     *
     * @param files_path - This should be a path to a directory
     * @returns {*}
     */
    this.readFiles = function (folder, filename) {
        files_path = path.join(path.join(current_path, DESTINATION), folder);

        if (filename) {
            files_path = path.join(files_path, filename)
        }
        return new Promise(function (resolve, reject) {
            fs.lstat(files_path, function (err, stats) {
                if (err) {
                    return reject(err);
                }

                if (stats.isDirectory()) {
                    readDir(files_path).then(resolve, reject);
                } else {
                    readFile(files_path).then(resolve, reject);
                }
            })
        });
    };

    return this;
}();
