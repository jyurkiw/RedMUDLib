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
     * Add a room to an area.
     * Then gets passed the new room's roomNumber.
     * 
     * @memberof room
     * @param {any} areaCode The room's areacode.
     * @param {any} roomData The room data.
     * @returns A promise.
     */
    function addRoomAsync(areaCode, roomData) {
        // Protect roomData from mangling
        var room = Object.assign({}, roomData);

        // Validate the area code
        var baseAreaCode = codeutil.extractAreaCode(areaCode);
        var fullAreaCode = codeutil.buildAreaCode(baseAreaCode);

        return new Promise(function(resolve, reject) {
            // Validate area existance
            client.sismemberAsync(constants.AREAS_KEY, baseAreaCode)
                .then(function(exists) {
                    if (exists) {
                        reserveRoomNumberAsync(areaCode)
                            .then(function(roomNumber) {
                                room.roomnumber = roomNumber;

                                setRoomAsync(areaCode, roomNumber, room)
                                    .then(function() {
                                        resolve(roomNumber);
                                    })
                                    .catch(function(err) {
                                        reject(err);
                                    });
                            })
                            .catch(function(err) {
                                reject(err);
                            });
                    } else {
                        reject(constants.errors.CREATE_BAD_AREACODE);
                    }
                })
                .catch(function(err) {
                    reject(err);
                });
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
     * Reserve a room number in an area.
     * Then is passed the room number.
     * 
     * @memberof room
     * @param {any} areaCode The room's area code.
     * @returns A promise.
     */
    function reserveRoomNumberAsync(areaCode) {
        return new Promise(function(resolve, reject) {
            // Validate the area code
            var baseAreaCode = codeutil.extractAreaCode(areaCode);
            var fullAreaCode = codeutil.buildAreaCode(baseAreaCode);

            client.hincrbyAsync(fullAreaCode, constants.AREA_DATA_SIZE_KEY, 1)
                .then(function(roomnumber) {
                    resolve(roomnumber);
                })
                .catch(function(err) {
                    reject(err);
                });
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
     * Set a connection from one room to a second.
     * Then is not passed an argument.
     * 
     * @memberof room
     * @param {any} command The exit command.
     * @param {any} sourceRoom The room to add the exit to.
     * @param {any} destinationRoom The room the exit leads to.
     * @returns A promise.
     */
    function setConnectionAsync(command, sourceRoom, destinationRoom) {
        var sourceCode = getRoomCode(sourceRoom);
        var destinationCode = getRoomCode(destinationRoom);

        return new Promise(function(resolve, reject) {
            client.hmsetAsync(codeutil.convertRoomToExitsCode(sourceCode), command, destinationCode)
                .then(function() {
                    resolve();
                })
                .catch(function(err) {
                    reject(err);
                });
        });
    }

    /**
     * Unset a room connection.
     * Then is not passed an argument.
     * 
     * @param {any} command The exit command.
     * @param {any} sourceRoom The room to remove the exit from.
     * @returns A promise.
     */
    function unsetConnectionAsync(command, sourceRoom) {
        var sourceCode = codeutil.convertRoomToExitsCode(getRoomCode(sourceRoom));

        return new Promise(function(resolve, reject) {
            client.hdelAsync(sourceCode, command)
                .then(function() {
                    resolve();
                })
                .catch(function(err) {
                    reject(err);
                });
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
     * Set the value of the room.
     * Then is not passed an argument.
     * 
     * @memberof room
     * @param {any} areaCode The room's area code.
     * @param {any} roomNumber The number of the room.
     * @param {any} roomData The room data to set.
     * @returns A promise.
     */
    function setRoomAsync(areaCode, roomNumber, roomData) {
        // Validate the area code
        var baseAreaCode = codeutil.extractAreaCode(areaCode);
        var roomCode = codeutil.buildRoomCode(baseAreaCode, roomNumber);

        return new Promise(function(resolve, reject) {
            client.hmsetAsync(roomCode, roomData)
                .then(function() {
                    resolve();
                })
                .catch(function(err) {
                    reject(err);
                });
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
     * Connect roomA to roomB with the provided roomA.command,
     * and connect roomB to roomA with the provided roomB.command.
     * Then is passed no argument.
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
     * @param {any} roomA
     * @param {any} roomB
     * @returns A promise.
     */
    function connectRoomsAsync(roomA, roomB) {
        return new Promise(function(resolve, reject) {
            Promise.all([
                    setConnectionAsync(roomA.command, roomA.source, roomB.source),
                    setConnectionAsync(roomB.command, roomB.source, roomA.source)
                ])
                .then(function() {
                    resolve();
                })
                .catch(function(err) {
                    reject(err);
                });
        });
    }

    /**
     * Internal function to get an exit command by value from a room object.
     * 
     * @param {string} roomCode
     * @param {object} room
     * @returns The command string if found, and null otherwise.
     */
    function getRoomCommand(roomCode, room) {
        for (var command in room.exits) {
            if (room.exits[command] == roomCode) {
                return command;
            }
        }

        return null;
    }

    /**
     * Disconnect two connected rooms.
     * If either room is not connected to the other, a rejected promise will be returned with
     * an error message.
     * If either room has all exits removed, that room object will cease to have an exits
     * property in future getRoom() calls until a new exit is added.
     * RoomA and RoomB must be room objects.
     * 
     * @param {any} roomA The first room.
     * @param {any} roomB The second room.
     * @returns A promise.
     */
    function disconnectRoomsAsync(roomA, roomB) {
        var roomCodeA = getRoomCode(roomA);
        var roomCodeB = getRoomCode(roomB);
        var exitCommandA = getRoomCommand(roomCodeB, roomA);
        var exitCommandB = getRoomCommand(roomCodeA, roomB);

        if (exitCommandA === null || exitCommandB === null) {
            return Promise.reject("The passed rooms are not a two-way connection.");
        }

        return Promise.all([
            new Promise(function(resolve, reject) {
                unsetConnectionAsync(exitCommandA, roomA)
                    .then(function() {
                        resolve();
                    })
                    .catch(function(err) {
                        reject(err);
                    });
            }),
            new Promise(function(resolve, reject) {
                unsetConnectionAsync(exitCommandB, roomB)
                    .then(function() {
                        resolve();
                    })
                    .catch(function(err) {
                        reject(err);
                    });
            })
        ]);
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

                    // Roomnumber should be a number. Cast it if necessary
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
     * Get a room.
     * Then is passed the room.
     * 
     * @memberof room
     * @param {any} areaCode The room's area code.
     * @param {any} roomNumber The room's number.
     * @returns A promise.
     */
    function getRoomAsync(areaCode, roomNumber) {
        var roomCode = codeutil.buildRoomCode(areaCode, roomNumber);
        var roomExCode = codeutil.convertRoomToExitsCode(roomCode);

        return new Promise(function(resolve, reject) {
            // the hgetall calls are resolved and returned in order
            // so resultArray[0] will always refer to the roomCode resultArray
            // so long as hgetall(roomCode) is first.
            // Because the order is defined here, I don't consider them to
            // be 'magic numbers'.
            client.multi()
                .hgetall(roomCode)
                .hgetall(roomExCode)
                .execAsync()
                .then(function(resultArray) {
                    if (resultArray[0] !== null) {
                        var roomData = resultArray[0];

                        // Roomnumber should be a number. Cast it if necessary
                        if (typeof(roomData.roomnumber !== 'number')) {
                            roomData.roomnumber = parseInt(roomData.roomnumber, 10);
                        }

                        if (resultArray[1] !== null) {
                            roomData.exits = resultArray[1];
                        }
                        resolve(roomData);
                    }
                    resolve(null);
                })
                .catch(function(err) {
                    reject(err);
                });
        });
    }

    /**
     * Delete a room from an area.
     * 
     * The callback function receives true if the delete was successful.
     * 
     * If a single room was deleted the status code will be 1, and msg will be blank.
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
                callback(true);
            });
        });
    }

    /**
     * Delete a room from an area.
     * Then receives true if the delete was successful.
     * 
     * @memberof room
     * @param {any} areaCode The room's area code.
     * @param {any} roomNumber The room's number.
     * @returns A promise.
     */
    function deleteRoomAsync(areaCode, roomNumber) {
        var fullAreaCode = codeutil.buildAreaCode(areaCode);
        var roomCode = codeutil.buildRoomCode(areaCode, roomNumber);

        return new Promise(function(resolve, reject) {
            client.delAsync(roomCode)
                .then(function() {
                    client.hincrbyAsync(fullAreaCode, constants.AREA_DATA_SIZE_KEY, -1)
                        .then(function() {
                            resolve(true);
                        })
                        .catch(function(err) {
                            reject(err);
                        });
                })
                .catch(function(err) {
                    reject(err);
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
            deleteRoom: deleteRoom,

            async: {
                addRoom: addRoomAsync,
                reserveRoomNumber: reserveRoomNumberAsync,
                setConnection: setConnectionAsync,
                unsetConnection: unsetConnectionAsync,
                setRoom: setRoomAsync,
                connectRooms: connectRoomsAsync,
                disconnectRooms: disconnectRoomsAsync,
                getRoom: getRoomAsync,
                deleteRoom: deleteRoomAsync
            }
        }
    };
}

module.exports = RoomLib;