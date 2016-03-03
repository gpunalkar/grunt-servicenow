module.exports = function (sync_data) {

    var hashContent = function (content) {
        return crypto.createHash('md5').update(content).digest('hex');
    };

    var saveHash = function (file_path, hash) {
        if (!(file_path in sync_data)) {
            sync_data[file_path] = {}
        }
        sync_data[file_path].hash = hash;
        //fileHelper.save(sync_data);
    };

    this.compareHashAndSave = function (file_path, new_content, force) {
        if (typeof force === "undefined")
            force = false;
        var hash_comparison,
            new_hash = hashContent(new_content);

        if (!(file_path in sync_data)) {
            // Use a logger
            console.log("Hash doesn't exist, creating one.");
            hash_comparison = true;
        } else {
            hash_comparison = sync_data[file_path].hash == new_hash
        }

        if (hash_comparison || force) {
            saveHash(file_path, new_hash);
        }

        return hash_comparison || force;
    };
};
