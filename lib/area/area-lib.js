/**
 * Library that deals with areas.
 * 
 * @param {any} client A redis client object.
 * @param {any} constants A serverconstants object.
 * @param {any} codeutil A codeutil object.
 * @returns An access object.
 */
function AreaLib(client, constants, codeutil) {
    if (typeof(client) === 'undefined') throw "Client argument is required";
    if (typeof(constants) === 'undefined') throw "Constants argument is required";
    if (typeof(codeutil) === 'undefined') throw "Codeutil argument is required";

    /**
     * Set an area. See documentation for area-object structure.
     * areaData.areacode must match areaCode unless you are updating the areaCode
     * structure. Then it can be omitted.
     * 
     * @param {any} areaCode The area code to set.
     * @param {any} areaData The area data.
     * @returns {boolean} False if the set failed.
     */
    function setArea(areaCode, areaData) {
        if (areaCode != areaData.areacode && typeof(areaData.areacode) != 'undefined') {
            return false;
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
     * @param {any} areaCode The areacode to fetch.
     * @param {any} callback The callback to execute.
     */
    function getArea(areaCode, callback) {
        client.hgetall(codeutil.buildAreaCode(areaCode), function(err, res) {
            res.size = parseInt(res.size, 10);
            callback(res);
        });
    }

    /**
     * Delete an area.
     * 
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
        deleteArea: deleteArea
    };
}

module.exports = AreaLib;