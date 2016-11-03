/**
 * Library that deals with rooms.
 * 
 * @namespace room
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
     * <code><pre>
     * {
     *      areacode: koboldValleyArea.areacode,
     *      roomnumber: 1,
     *      name: 'Western Overlook',
     *      description: 'A short cliff overlooks a small, fertile valley. You can see scores of Kobolds milling about doing whatever it is Kobolds do.'
     * }
     * </pre></code>
     * 
     * @memberof room
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
     * @memberof room
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

    /**
     * Internal function used to turn room data objects into room keys while
     * automatically filtering out room codes.
     * This function is private and primarily used for the addConnection and connectRooms funcitons.
     * 
     * @memberof room
     * @param {string|object} roomData The room data to turn into a code. Will also take a code as a string. 
     * @returns A room code.
     */
    function getRoomCode(roomData) {
        if (typeof(roomData) === 'string') {
            return roomData;
        } else if (typeof(roomData) === 'object' && typeof(roomData.areacode) === 'string' && typeof(roomData.roomnumber) === 'number') {
            return codeutil.buildRoomCode(roomData.areacode, roomData.roomnumber);
        } else {
            throw "No room code could be built from the data provided: " + roomData;
        }
    }

    /**
     * Set the connection for a source room through the provided command to the destination room.
     * 
     * The callback should have the following signature: function(). Yes, it's empty, and entirely optional.
     * 
     * @memberof room
     * @param {any} command The transversal command.
     * @param {any} sourceRoom The room to add the exit to.
     * @param {any} destinationRoom The room to connect the source room to.
     * @param {any} callback An optional callback.
     */
    function setConnection(command, sourceRoom, destinationRoom, callback) {
        var sourceCode = getRoomCode(sourceRoom);
        var destinationCode = getRoomCode(destinationRoom);

        client.hmset(codeutil.convertRoomToExitsCode(sourceCode), command, destinationCode, function(err, res) {
            if (typeof(callback) === 'function') {
                callback();
            }
        });
    }

    /**
     * Set a room's data.
     * The callback's signature is function() (yes, it's empty).
     * 
     * Example Room Data:
     * <code><pre>
     * {
     *      areacode: koboldValleyArea.areacode,
     *      roomnumber: 1,
     *      name: 'Western Overlook',
     *      description: 'A short cliff overlooks a small, fertile valley. You can see scores of Kobolds milling about doing whatever it is Kobolds do.'
     * }
     * </pre></code>
     * 
     * @memberof room
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

    /**
     * Connect roomA to roomB with the provided roomA.command,
     * and connect roomB to roomA with the provided roomB.command.
     * 
     * Callback function signature is function(). Yes, it's empty, and totally optional.
     * 
     * Connection signatures are objects with the following structure:
     * <code><pre>
     * { source: object|string, command: string }
     * </pre></code>
     * 
     * The source member is either a room data object, or a room code string.
     * Room data objects are defined in the documentation. 
     * 
     * @memberof room
     * @param {any} roomA Connection signature for roomA.
     * @param {any} roomB Connection signature for roomB.
     * @param {any} callback Optional blank callback.
     */
    function connectRooms(roomA, roomB, callback) {
        var roomACode = getRoomCode(roomA.source);
        var roomBCode = getRoomCode(roomB.source);

        client.multi()
            .hset(codeutil.convertRoomToExitsCode(roomACode), roomA.command, roomBCode)
            .hset(codeutil.convertRoomToExitsCode(roomBCode), roomB.command, roomACode)
            .exec(function(err, mres) {
                if (typeof(callback) === 'function') {
                    callback();
                }
            });
    }

    /**
     * Get a room by area code and room number.
     * Callback signature is function(roomdata).
     * 
     * @memberof room
     * @param {any} areaCode The room area.
     * @param {any} roomNumber The room number.
     * @param {any} callback The roomdata callback.
     */
    function getRoom(areaCode, roomNumber, callback) {
        var roomCode = codeutil.buildRoomCode(areaCode, roomNumber);
        var roomExCode = codeutil.convertRoomToExitsCode(roomCode);

        // the hgetall calls are resolved and returned in order
        // so resultArray[0] will always refer to the roomCode resultArray
        // so long as hgetall(roomCode) is first.
        // Because the order is defined here, I don't consider them to
        // be 'magic numbers'.
        client.multi()
            .hgetall(roomCode)
            .hgetall(roomExCode)
            .exec(function(err, resultArray) {
                if (resultArray[0] !== null) {
                    var roomData = resultArray[0];

                    // Roomnumber should be a number. Cast it in res if necessary
                    if (typeof(roomData.roomnumber !== 'number')) {
                        roomData.roomnumber = parseInt(roomData.roomnumber, 10);
                    }

                    if (resultArray[1] !== null) {
                        roomData.exits = resultArray[1];
                    }
                    callback(roomData);
                } else {
                    callback(null);
                }
            });
    }

    /**
     * Delete a room from an area.
     * If the deleted room was the last room in the area, delete the area.
     * 
     * The callback function has the following signature: function(status)
     * where status is an object with the following structure:
     * <code><pre>
     * {
     *      msg: string,
     *      code: number
     * }
     * </pre></code>
     * 
     * If a single room was deleted but the area was not, the status code will be 1, and msg will be blank.
     * If the area was deleted, the status code will be 101 and the message will explain that the area was deleted.
     * 
     * @memberof room
     * @param {any} areaCode The area code.
     * @param {any} roomNumber The room number.
     * @param {any} callback Optional callback.
     */
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
        room: {
            addRoom: addRoom,
            reserveRoomNumber: reserveRoomNumber,
            setConnection: setConnection,
            setRoom: setRoom,
            connectRooms: connectRooms,
            getRoom: getRoom,
            deleteRoom: deleteRoom
        }
    };
}

module.exports = RoomLib;