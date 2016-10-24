/**
 * Library that deals with rooms.
 * 
 * @param {any} client A redis client.
 * @returns A function access object.
 */
function RoomLib(client) {
    if (typeof(client) === 'undefined') throw "Client argument is required";

    var constants = require('../constants');
    var codeutil = require('../util/codeutil');

    /**
     * Add a room to an area.
     * The callback signature is function(roomNumber).
     * This function validates the area code, verifies area existence, automatically increments the area size, and defines the room number.
     * The room data structure can be found in the documentation.
     * 
     * Example Room Data:
     * {
     *      areacode: koboldValleyArea.areacode,
     *      roomnumber: 1,
     *      name: 'Western Overlook',
     *      description: 'A short cliff overlooks a small, fertile valley. You can see scores of Kobolds milling about doing whatever it is Kobolds do.'
     * }
     * 
     * @param {any} areaCode The area code.
     * @param {any} roomData The room's data. This structure is defined in the documentation.
     * @param {any} callback Optional callback.
     */
    function addRoom(areaCode, roomData, callback) {
        // Validate the area code
        var baseAreaCode = codeutil.extractAreaCode(areaCode);
        var fullAreaCode = codeutil.buildAreaCode(baseAreaCode);

        // Validate area existance
        client.sismember(constants.AREAS_KEY, baseAreaCode, function(areaErr, areaMemberCount) {
            if (areaMemberCount === 1) {
                reserveRoomNumber(areaCode, function(roomNumber) {
                    roomData.roomnumber = roomNumber;

                    setRoom(areaCode, roomNumber, roomData, function() {
                        if (typeof(callback) === 'function') {
                            callback(roomNumber);
                        }
                    });
                });
            }
        });
    }

    /**
     * Reserve a room number.
     * The callback signature is function(roomNumber).
     * 
     * @param {any} areaCode The area code.
     * @param {any} callback The optional callback.
     */
    function reserveRoomNumber(areaCode, callback) {
        // Validate the area code
        var baseAreaCode = codeutil.extractAreaCode(areaCode);
        var fullAreaCode = codeutil.buildAreaCode(baseAreaCode);

        client.hincrby(fullAreaCode, constants.AREA_DATA_SIZE_KEY, 1, function(err, res) {
            if (typeof(callback) === 'function') {
                callback(res);
            }
        });
    }

    function addRoomConnection() {

    }

    /**
     * Set a room's data.
     * The callback's signature is function() (yes, it's empty).
     * 
     * Example Room Data:
     * {
     *      areacode: koboldValleyArea.areacode,
     *      roomnumber: 1,
     *      name: 'Western Overlook',
     *      description: 'A short cliff overlooks a small, fertile valley. You can see scores of Kobolds milling about doing whatever it is Kobolds do.'
     * }
     * 
     * @param {any} areaCode
     * @param {any} roomNumber
     * @param {any} roomData
     */
    function setRoom(areaCode, roomNumber, roomData, callback) {
        // Validate the area code
        var baseAreaCode = codeutil.extractAreaCode(areaCode);
        var roomCode = codeutil.buildRoomCode(baseAreaCode, roomNumber);

        client.hmset(roomCode, roomData, function(err, res) {
            if (typeof(callback) === 'function') {
                callback();
            }
        });
    }

    function joinRooms() {

    }

    /**
     * Get a room by area code and room number.
     * Callback signature is function(roomdata).
     * 
     * @param {any} areaCode The room area.
     * @param {any} roomNumber The room number.
     * @param {any} callback The roomdata callback.
     */
    function getRoom(areaCode, roomNumber, callback) {
        client.hgetall(codeutil.buildRoomCode(areaCode, roomNumber), function(err, res) {
            // Roomnumber should be a number. Cast it in res if necessary
            if (res !== null && typeof(res.roomnumber !== 'number')) {
                res.roomnumber = parseInt(res.roomnumber, 10);
            }

            callback(res);
        });
    }

    function deleteRoom(areaCode, roomNumber, callback) {
        var fullAreaCode = codeutil.buildAreaCode(areaCode);
        var roomCode = codeutil.buildRoomCode(areaCode, roomNumber);

        client.del(roomCode, function(delErr, numDel) {
            client.hincrby(fullAreaCode, constants.AREA_DATA_SIZE_KEY, -1, function(decErr, areaSize) {
                if (areaSize === 0) {
                    client.del(fullAreaCode, function(areaDelErr, areaDel) {
                        client.srem(constants.AREAS_KEY, areaCode, function(areaSetRemErr, blankRes) {
                            callback({ msg: constants.AREA_DELETED_MSG, code: constants.AREA_DELETED });
                        });
                    });
                } else {
                    callback({ msg: '', code: constants.OK });
                }
            });
        });
    }

    return {
        addRoom: addRoom,
        reserveRoomNumber: reserveRoomNumber,
        addRoomConnection: addRoomConnection,
        setRoom: setRoom,
        joinRooms: joinRooms,
        getRoom: getRoom,
        deleteRoom: deleteRoom
    };
}

module.exports = RoomLib;