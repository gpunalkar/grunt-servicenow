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
    }
};