var path = require('path'),
    fs = require('fs-extra'),
    current_path = process.cwd(),
    DESTINATION = require('../config/constant').DESTINATION;


module.exports = function () {

    var readDir = function (dir_path, relative_filename) {
        var all_files = [];
        return new Promise(function (fresolve, reject) {
            fs.readdir(dir_path, function (err, files) {
                if (err) {
                    return reject(err)
                }
                var promisesCreated = [];

                var currentPromise;
                files.forEach(function (file_name) {
                    promisesCreated.push(new Promise(function (resolve, reject) {
                        var full_path = path.join(dir_path, file_name);


                        fs.lstat(full_path, function (err, stats) {
                            if (err) {
                                return reject(err);
                            }

                            if (stats.isDirectory()) {


                                readDir(full_path, true).then(function (all_files) {
                                    fresolve(all_files)
                                });

                            } else {
                                (function () {
                                    var final_name;
                                    if (relative_filename) {
                                        final_name = full_path.split('/').slice(-2).join('/')
                                    } else {
                                        final_name = path.basename(path.basename(full_path));
                                    }
                                    fs.readFile(full_path, "utf-8", function (err, data) {
                                        all_files.push({
                                            name: final_name,
                                            content: data
                                        });
                                        resolve();
                                    });
                                })();

                            }
                        });


                    }));

                });
                Promise.all(promisesCreated).then(function () {
                    fresolve(all_files);
                });

            });
        });
    };

    var readFile = function (file_path, relative_filename) {
        if (!(path.isAbsolute(file_path))) file_path = path.join(current_path, file_path);
        var all_files = [];
        return new Promise(function (resolve, reject) {
            fs.readFile(file_path, "utf-8", function (err, data) {
                if (err) {
                    return reject()
                }
//                num_of_files_loaded++;
//                name: path.basename(file_path),
                all_files.push({
                    name: relative_filename,
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
    this.readFiles = function (folder, filename, config) {
        var files_path = path.join(current_path, config.app_dir, folder);

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
                    readFile(files_path, filename).then(resolve, reject);
                }
            })
        });
    };

    return this;
}();
