/**
 * Library that deals with areas.
 * 
 * @namespace area
 * @param {any} client A redis client object.
 * @returns An access object.
 */
function AreaLib(client) {
    if (typeof(client) === 'undefined') throw "Client argument is required";

    var constants = require('../constants');
    var codeutil = require('../util/codeutil');

    /**
     * Set an area. See documentation for area-object structure.
     * areaData.areacode must match areaCode unless you are updating the areaCode
     * structure. Then it can be omitted.
     * 
     * Example Area Structure:
     * <code><pre>
     * {
     *     areacode: "KDV",
     *     name: "Kobold Valley",
     *     description: "A valley filled with dangerous Kobolds.",
     *     size: 0
     * }
     * </pre></code>
     * 
     * @memberof area
     * @param {any} areaCode The area code to set.
     * @param {any} areaData The area data.
     * @returns {boolean} False if the set failed.
     */
    function setArea(areaCode, areaData) {
        if (areaCode != areaData.areacode && typeof(areaData.areacode) != 'undefined') {
            return false;
        }

        // If passed areaData.size does not exist, add and set to zero
        if (typeof(areaData.size) === 'undefined') {
            areaData.size = 0;
        }

        client.hmset(codeutil.buildAreaCode(areaCode), areaData);

        // Add the area to the areas list
        client.sadd(constants.AREAS_KEY, areaCode);

        return true;
    }

    /**
     * Get the areas.
     * Callback signature is function(areas) where areas is an array of area codes.
     * 
     * @memberof area
     * @param {any} callback The callback to feed the areas to.
     */
    function getAreas(callback) {
        client.smembers(constants.AREAS_KEY, function(err, res) {
            callback(res);
        });
    }

    /**
     * Get an area.
     * Callback signature is function(area) where area is an area's data.
     * Area data signature can be found in the documentation.
     * 
     * @memberof area
     * @param {any} areaCode The areacode to fetch.
     * @param {any} callback The callback to execute.
     */
    function getArea(areaCode, callback) {
        client.hgetall(codeutil.buildAreaCode(areaCode), function(err, res) {
            if (res !== null && typeof(res.size) !== 'number') {
                res.size = parseInt(res.size, 10);
            }
            callback(res);
        });
    }

    /**
     * Does an area, with the given areaCode, exist? True or false.
     * 
     * The callback has the following signature: function(exists) where {exists} is a boolean.
     * 
     * @memberof area
     * @param {string} areaCode The areacode to check.
     * @param {function} callback The callback to execute (required).
     */
    function areaExists(areaCode, callback) {
        client.sismember(constants.AREAS_KEY, areaCode, function(err, res) {
            callback(res === 1);
        });
    }

    /**
     * Delete an area.
     * 
     * @memberof area
     * @param {any} areaCode The areacode to delete.
     */
    function deleteArea(areaCode) {
        client.srem(constants.AREAS_KEY, areaCode);

        var hashKey = codeutil.buildCode(constants.AREAS_KEY, areaCode);
        client.hkeys(hashKey, function(err, res) {
            var multiCmd = client.multi();
            for (var i = 0; i < res.length; i++) {
                multiCmd.hdel(hashKey, res[i]);
            }
            multiCmd.exec();
        });
    }

    return {
        setArea: setArea,
        getAreas: getAreas,
        getArea: getArea,
        areaExists: areaExists,
        deleteArea: deleteArea
    };
}

module.exports = AreaLib;