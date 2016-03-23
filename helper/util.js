/**
 * Created by arthur.oliveira on 3/8/16.
 */
module.exports = {
    mergeObject: function (obj1, obj2) {
        var result = {};
        for (var attrname in obj1) {
            result[attrname] = obj1[attrname];
        }
        for (var attrname in obj2) {
            result[attrname] = obj2[attrname];
        }
        return result;
    },
    slugify: function (text) {
        return text.toString().toLowerCase()
            .replace(/\s+/g, '-')           // Replace spaces with -
            .replace(/\//g, '_')           // Replace / with _
            .replace(/\?/g, '_')           // Replace ? with _
            .replace(/\=/g, '_')           // Replace = with _
            .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
            .replace(/\-\-+/g, '-')         // Replace multiple - with single -
            .replace(/^-+/, '')             // Trim - from start of text
            .replace(/-+$/, '');            // Trim - from end of text
    }
};