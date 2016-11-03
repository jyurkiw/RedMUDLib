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
     * Create an area. See documentation for area-object structure.
     * areaData.areacode must match areaCode
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
     * @param {any} callback The callback to execute.
     */
    function createArea(areaCode, areaData, callback) {
        if (typeof(areaData.areacode) != 'undefined' && areaCode != areaData.areacode) {
            if (typeof(callback) !== 'undefined') {
                callback(false);
                return;
            }
        }

        // If passed areaData.size does not exist, add and set to zero
        if (typeof(areaData.size) === 'undefined') {
            areaData.size = 0;
        }

        areaExists(areaCode, function(exists) {
            if (exists) {
                if (typeof(callback) !== 'undefined') {
                    callback(false);
                    return;
                }
            } else {
                client.multi()
                    .hmset(codeutil.buildAreaCode(areaCode), areaData)
                    // Add the area to the areas list
                    .sadd(constants.AREAS_KEY, areaCode)
                    .exec(function(err, res) {
                        if (typeof(callback) !== 'undefined') {
                            callback(true);
                        }
                    });
            }
        });
    }

    /**
     * Create an area. See documentation for area-object structure.
     * areaData.areacode must match areaCode
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
     * @param {any} areaCode
     * @param {any} areaData
     * @returns a Promise.
     */
    function createAreaAsync(areaCode, areaData) {
        return new Promise(function(resolve, reject) {
            if (typeof(areaData.areacode) != 'undefined' && areaCode != areaData.areacode) {
                reject(constants.errors.CREATE_AREACODE_NO_EXIST_IN_PAYLOAD);
            } else if (typeof(areaData.size) === 'undefined') {
                areaData.size = 0;
            }

            areaExistsAsync(areaCode)
                .then(function(exists) {
                    if (!exists) {
                        client.multi()
                            .hmset(codeutil.buildAreaCode(areaCode), areaData)
                            .sadd(constants.AREAS_KEY, areaCode)
                            .exec(function(err, res) {
                                if (err !== null) {
                                    reject(err);
                                } else {
                                    resolve(true);
                                }
                            });
                    }
                });
        });
    }

    /**
     * Set an area. See documentation for area-object structure.
     * areaData.areacode should be ommitted. If it exists, it will
     * be removed. Same with size. Size cannot be updated and
     * will be checked for and removed.
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
    function setArea(areaCode, areaData, callback) {
        if (areaCode != areaData.areacode && typeof(areaData.areacode) != 'undefined') {
            if (typeof(callback) === 'function') {
                callback(false);
                return;
            }
        } else if (typeof(areaData.areacode) !== 'undefined') {
            delete areaData.areacode;
        } else if (typeof(areaData.size) !== 'undefined') {
            delete areaData.size;
        }

        areaExists(areaCode, function(exists) {
            if (!exists) {
                if (typeof(callback) === 'function') {
                    callback(constants.errors.UPDATE_AREACODE_NO_EXIST);
                    return;
                }
            } else {
                client.hmset(codeutil.buildAreaCode(areaCode), areaData, function(err, res) {
                    if (err === null) {
                        if (typeof(callback) === 'function') {
                            getArea(areaCode, function(area) {
                                callback(area);
                                return;
                            });
                        }
                    } else {
                        if (typeof(callback) === 'function') {
                            getArea(areaCode, function(area) {
                                callback(err);
                                return;
                            });
                        }
                    }
                });
            }
        });
    }

    /**
     * Set an area. See documentation for area-object structure.
     * areaData.areacode should be ommitted. If it exists, it will
     * be removed. Same with size. Size cannot be updated and
     * will be checked for and removed.
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
     * @returns a promise.
     */
    function setAreaAsync(areaCode, areaData) {
        return new Promise(function(resolve, reject) {
            if (typeof(areaData.areacode) !== 'undefined') {
                // Never update areacode.
                delete areaData.areacode;
            } else if (typeof(areaData.size) !== 'undefined') {
                // Never update size
                delete areaData.size;
            }

            areaExistsAsync(areaCode)
                .then(function(exists) {
                    if (exists) {
                        client.hmset(codeutil.buildAreaCode(areaCode), areaData, function(err, res) {
                            if (err !== null) {
                                reject(err);
                            } else {
                                resolve(true);
                            }
                        });
                    } else {
                        reject(constants.errors.UPDATE_AREACODE_NO_EXIST);
                    }
                });
        });
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
     * Get the areas.
     * 
     * @memberof area
     * @param {any} callback The callback to feed the areas to.
     * @returns a promise.
     */
    function getAreasAsync() {
        return new Promise(function(resolve, reject) {
            client.smembers(constants.AREAS_KEY, function(err, res) {
                if (err !== null) {
                    reject(err);
                } else {
                    resolve(res);
                }
            });
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

            if (res !== null && (typeof(res.size) === 'undefined' || res.size === null || isNaN(res.size))) {
                res.size = 0;
            }

            callback(res);
        });
    }

    /**
     * Get an area.
     * Area data signature can be found in the documentation.
     * 
     * @memberof area
     * @param {any} areaCode The areacode to fetch.
     * @param {any} callback The callback to execute.
     * @returns a promise.
     */
    function getAreaAsync(areaCode) {
        return new Promise(function(resolve, reject) {
            client.hgetall(codeutil.buildAreaCode(areaCode), function(err, res) {
                if (err !== null) {
                    reject(err);
                }

                if (res !== null && typeof(res.size) !== 'number') {
                    res.size = parseInt(res.size, 10);
                }

                if (res !== null && (typeof(res.size) === 'undefined' || res.size === null || isNaN(res.size))) {
                    res.size = 0;
                }

                resolve(res);
            });
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
     * Does an area, with the given areaCode, exist? True or false.
     * 
     * @memberof area
     * @param {string} areaCode The areacode to check.
     * @param {function} callback The callback to execute (required).
     * @returns a promise.
     */
    function areaExistsAsync(areaCode) {
        return new Promise(function(resolve, reject) {
            client.sismember(constants.AREAS_KEY, areaCode, function(err, res) {
                if (err !== null) {
                    reject(err);
                } else {
                    resolve(res === 1);
                }

            });
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

    /**
     * Delete an area.
     * 
     * @memberof area
     * @param {any} areaCode The areacode to delete.
     * @returns a promise.
     */
    function deleteAreaAsync(areaCode) {
        return new Promise(function(resolve, reject) {
            var hashKey = codeutil.buildCode(constants.AREAS_KEY, areaCode);

            var multiCmd = client.multi();
            client.hkeys(hashKey, function(err, res) {
                multiCmd.srem(constants.AREAS_KEY, areaCode);

                for (var i = 0; i < res.length; i++) {
                    multiCmd.hdel(hashKey, res[i]);
                }
                multiCmd.exec(function(err, res) {
                    if (err === null) {
                        resolve(true);
                    } else {
                        reject(err);
                    }
                });
            });
        });
    }

    return {
        area: {
            createArea: createArea,
            setArea: setArea,
            getAreas: getAreas,
            getArea: getArea,
            areaExists: areaExists,
            deleteArea: deleteArea,

            async: {
                createArea: createAreaAsync,
                setArea: setAreaAsync,
                getAreas: getAreasAsync,
                getArea: getAreaAsync,
                areaExists: areaExistsAsync,
                deleteArea: deleteAreaAsync
            }
        }
    };
}

module.exports = AreaLib;