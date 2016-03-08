/**
 * Created by arthur.oliveira on 3/8/16.
 */
module.exports = {
    mergeObject: function(mergeFrom, mergeTo){
        for (var attrname in mergeFrom) { mergeTo[attrname] = mergeFrom[attrname]; }
    }
};