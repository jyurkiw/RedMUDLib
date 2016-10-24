function RoomLib(client) {
    if (typeof(client) === 'undefined') throw "Client argument is required";

    var constants = require('../constants');
    var codeutil = require('../util/codeutil');

    function setRoom() {

    }

    function setRoomExits() {

    }

    function getRoom() {

    };

    function deleteRoom() {

    }

    return {
        setRoom: setRoom,
        setRoomExits: setRoomExits,
        getRoom: getRoom,
        deleteRoom: deleteRoom
    };
}

module.exports = RoomLib;