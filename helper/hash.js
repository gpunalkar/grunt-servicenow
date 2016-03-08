var fs = require('fs'),
    crypto = require('crypto'),
    path = require('path'),
    syncDataHelper = require('../helper/sync_data_validator'),
    ServiceNow = require('../services/snclient');


module.exports = function (sync_data) {

    var saveHash = function (file_path, hash) {
        if (!(file_path in sync_data)) {
            sync_data[file_path] = {}
        }
        sync_data[file_path].hash = hash;

        syncDataHelper.saveData(sync_data);
    };

    this.hashContent = function (content) {
        return crypto.createHash('md5').update(content).digest('hex');
    };

    this.compareHash = function (file_path) {
        var that = this;
        var absolute_path = path.join(process.cwd(), file_path);
        return new Promise(function (fulfill, reject) {

            fs.readFile(absolute_path, 'utf8', function (err, data) {
                var hash_comparison;

                if (err) {
                    console.log(err);
                } else {
                    var file_hash = that.hashContent(data);
                }

                if (!(file_path in sync_data)) {
                    // Use a logger
                    console.log("Hash doesn't exist, creating one.");
                    hash_comparison = 0;
                } else {
                    hash_comparison = sync_data[file_path].hash.localeCompare(file_hash)
                }


                if (hash_comparison == 0) {
                    fulfill(true);
                } else {
                    fulfill(false);
                }
            });
        });
    };

    this.compareHashRemote = function (file_path, foldername, config) {
        var snService = new ServiceNow(config).setup();
        var folder_config = config.folders[file_path]
    };

    return this;
};
