function RoomLib(client, constants, codeutil) {
    if (typeof(client) === 'undefined') throw "Client argument is required";
    if (typeof(constants) === 'undefined') throw "Constants argument is required";
    if (typeof(codeutil) === 'undefined') throw "Codeutil argument is required";

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