var path = require('path'),
    fs = require('fs-extra'),
    current_path = process.cwd(),
    // DESTINATION = require('../config/constant').DESTINATION,
    require_config = require("./config_validator"),
    DESTINATION;


require_config().then(function (config) {
    DESTINATION = config.app_dir;
});


module.exports = function () {

    var readDir = function (dir_path) {
        var all_files = [];
        return new Promise(function (resolve, reject) {
            fs.readdir(dir_path, function (err, files) {
                if (err) {
                    return reject(err)
                }
                var promisesCreated = [];

                var currentPromise;
                files.forEach(function (file_name) {

                    promisesCreated.push(new Promise(function (resolve, reject) {
                        fs.readFile(path.join(dir_path, file_name), "utf-8", function (err, data) {
                            all_files.push({
                                name: path.basename(file_name),
                                content: data
                            });
                            resolve();
                        });
                    }));

                });
                Promise.all(promisesCreated).then(function () {
                    resolve(all_files);
                });

            });
        });
    };

    var readFile = function (file_path) {
        if (!(path.isAbsolute(file_path))) file_path = path.join(current_path, file_path);
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

    this.saveFile = function (file_path, file_content) {
        var _this = this;

        if (!(path.isAbsolute(file_path))) file_path = path.join(current_path, file_path);
        return new Promise(function (resolve, reject) {
            fs.outputFile(file_path, file_content, function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(file_path);
                }
            });
        });

    };


    /**
     *
     * @param files_to_create
     * {
     *  "/absolute/path/to/file_to_be_created_or_updated" : "File Content Here"
     * }
     * @returns Promise
     */
    this.saveFiles = function (files_to_create) {
        return new Promise(function (resolve, reject) {
            var total_files = Object.keys(files_to_create).length;
            var files_created = 0;
            var promisesList = [];
            for (file_path in files_to_create) {
                promisesList.push(this.saveFile(file_path, files_to_create[file_path]));
            }

            Promise.all(promisesList).then(function (files_saved) {
                resolve(files_saved);
            });
        });
    };

    /**
     *
     * @param files_path - This should be a path to a directory
     * @returns {*}
     */
    this.readFiles = function (folder, filename) {
        console.log(DESTINATION)
        var files_path = path.join(current_path, DESTINATION, folder);

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
