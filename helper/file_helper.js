var path = require('path'),
	fs = require('fs-extra');

module.exports = function () {

    var readDir = function (dir_path) {
        var all_files = {};
        return new Promise(function (resolve, reject) {
            fs.readdir(dir_path, function (err, files) {
                if (err) {
                    console.error("Error reading folder " + files_path, err);
                    reject(err)
                }


                var num_of_files = files.length;
                var num_of_files_loaded = 0;
                files.forEach(function (file_name) {
                    fs.readFile(read_name, "utf-8", function (err, data) {
                        num_of_files_loaded++;
                        all_files[file_name] = data;

                        if (num_of_files_loaded >= num_of_files) {
                            resolve(all_files);
                        }
                    });
                });

            });
        });
    };

    var readFile = function (file_path) {
        return new Promise(function (resolve, reject) {
            fs.readFile(read_name, "utf-8", function (err, data) {
                if (err) {
                    return reject()
                }
                num_of_files_loaded++;
                all_files[file_name] = data;

                if (num_of_files_loaded >= num_of_files) {
                    resolve(all_files);
                }
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
    this.readFiles = function (files_path) {
        return new Promise(function (resolve, reject) {
            fs.lstat(files_path, function (err, stats) {
                if (stats.isDirectory()) {
                    readDir(files_path).then(resolve,reject);
                } else {
                    readFile(files_path).then(resolve,reject);
                }
            })
        });
    };
}();
