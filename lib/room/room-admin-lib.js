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
     * @memberof admin-room
     * @param {string} areacode The area code.
     * @returns A promise (then is passed a {roomcode: name} object).
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
                });
        });
    }

    return {
        admin: {
            room: {
                async: {
                    getRoomLookupTableByArea: getRoomLookupTableByArea
                }
            }
        }
    };
}

module.exports = RoomAdminLib;