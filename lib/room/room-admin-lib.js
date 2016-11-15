/**
 * Admin library for dealing with rooms.
 * 
 * @namespace admin-room
 * @param {any} client A redis client.
 * @returns A function access object.
 */
function RoomAdminLib(client) {
    if (typeof(client) === 'undefined') throw "Client argument is required";
    var constants = require('../constants');
    var codeutil = require('../util/codeutil');

    /**
     * Produce a room name lookup table with names keyed to their roomcodes.
     * Intended to be used to make exits human-readable in the builder tool.
     * 
     * then is passed a {roomcode: name} object
     * 
     * @memberof admin-room
     * @param {string} areacode The area code.
     * @returns A promise.
     */
    function getRoomLookupTableByArea(areacode) {
        return new Promise(function(resolve, reject) {
            client.hmgetAsync(codeutil.buildAreaCode(areacode), constants.AREA_DATA_SIZE_KEY)
                .then(function(size) {
                    var maxIdx = parseInt(size[0], 10);
                    if (isNaN(maxIdx) || maxIdx === 0) {
                        reject(constants.errors.ADMIN_AREA_NO_ROOMS);
                    }

                    var query = client.multi();

                    for (var idx = 1; maxIdx !== null && idx <= maxIdx; idx++) {
                        query.hmget(codeutil.buildRoomCode(areacode, idx), constants.ROOM_DATA_ROOMNUMBER_KEY, constants.ROOM_DATA_NAME_KEY);
                    }

                    query.execAsync()
                        .then(function(lookupData) {
                            var lookupTable = {};

                            for (var lookupIdx in lookupData) {
                                lookupTable[codeutil.buildRoomCode(areacode, parseInt(lookupData[lookupIdx][0], 10))] = lookupData[lookupIdx][1];
                            }

                            resolve(lookupTable);
                        });
                })
                .catch(function(err) {
                    reject(err);
                });
        });
    }

    /**
     * Collect all rooms into a lookup table by area.
     * 
     * @memberof admin-room
     * @returns A lookup table object of room names keyed to room codes by area.
     */
    function getAllRoomsLookupTable() {
        return new Promise(function(resolve, reject) {
            client.smembersAsync(constants.AREAS_KEY)
                // Get all area sizes
                .then(function(areasList) {
                    var query = client.multi();
                    areasList.forEach(function(areacode) {
                        query.hmget(codeutil.buildAreaCode(areacode), constants.AREA_DATA_CODE_KEY, constants.AREA_DATA_SIZE_KEY)
                    });
                    return query.execAsync();
                })
                // Take area size, and query for each room
                .then(function(areasList) {
                    var query = client.multi();
                    areasList.forEach(function(areaSize) {
                        var areacode = areaSize[0];
                        var size = parseInt(areaSize[1], 10);

                        for (var roomIdx = 1; roomIdx <= size; roomIdx++) {
                            var roomcode = codeutil.buildRoomCode(areacode, roomIdx);
                            query.hmget(roomcode, constants.AREA_DATA_CODE_KEY, constants.ROOM_DATA_ROOMNUMBER_KEY, constants.ROOM_DATA_NAME_KEY);
                        }
                    });
                    return query.execAsync();
                })
                // Convert the room data into a lookup table
                .then(function(roomList) {
                    var lookupTable = {};

                    roomList.forEach(function(room) {
                        var areacode = room[0];
                        var roomnumber = parseInt(room[1], 10);
                        var name = room[2];

                        if (!lookupTable.hasOwnProperty(areacode)) {
                            lookupTable[areacode] = {};
                        }
                        lookupTable[areacode][codeutil.buildRoomCode(areacode, roomnumber)] = name;
                    });

                    resolve(lookupTable);
                });
        });
    }

    return {
        admin: {
            room: {
                async: {
                    getRoomLookupTableByArea: getRoomLookupTableByArea,
                    getAllRoomsLookupTable: getAllRoomsLookupTable
                }
            }
        }
    };
}

module.exports = RoomAdminLib;