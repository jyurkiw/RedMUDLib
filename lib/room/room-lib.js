function RoomLib(client) {
    if (typeof(client) === 'undefined') throw "Client argument is required";

    var constants = require('../constants');
    var codeutil = require('../util/codeutil');

    function addRoom(areaCode, roomData, callback) {
        // Validate the area code
        var baseAreaCode = codeutil.extractAreaCode(areaCode);
        var fullAreaCode = codeutil.buildAreaCode(baseAreaCode);

        client.sismember(constants.AREAS_KEY, baseAreaCode, function(err, areaExists) {
            if (areaExists === 1) {
                // Before we add the room, we need the room number
                client.hincrby(fullAreaCode, constants.AREA_DATA_SIZE_KEY, 1, function(err, roomNumber) {
                    // Set the room number
                    roomData.roomnumber = roomNumber;

                    // Add the room
                    client.hmset(codeutil.buildRoomCode(baseAreaCode, roomNumber), roomData, function(err, res) {
                        if (typeof(callback) === 'function') {
                            callback(roomData, roomNumber);
                        }
                    });
                });
            }
        });
    }

    function addRoomConnection() {

    }

    function updateRoom() {

    }

    function joinRooms() {

    }

    function getRoom() {

    }

    function deleteRoom() {

    }

    return {
        addRoom: addRoom,
        addRoomConnection: addRoomConnection,
        updateRoom: updateRoom,
        joinRooms: joinRooms,
        getRoom: getRoom,
        deleteRoom: deleteRoom
    };
}

module.exports = RoomLib;