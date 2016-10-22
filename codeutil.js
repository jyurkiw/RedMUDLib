function CodeUtil() {
    var constants = require('./serverconstants.js');

    function BuildCode() {
        var args = [];
        for (i = 0; i < arguments.length; i++)
            args.push(arguments[i]);
        return args.join(":");
    };

    function BuildAreaCode(areaCode) {
        return BuildCode(constants.AREAS_KEY, areaCode);
    };

    function BuildRoomCode(areaCode, roomNumber) {
        return BuildCode(constants.ROOMS_KEY, areaCode, roomNumber);
    };

    function BuildRoomExitsCode(areaCode, roomNumber) {
        return BuildCode(constants.ROOMS_KEY, areaCode, roomNumber, constants.ROOMS_EXIT_KEY);
    };

    return {
        buildCode: BuildCode,
        buildAreaCode: BuildAreaCode,
        buildRoomCode: BuildRoomCode,
        buildRoomExitsCode: BuildRoomExitsCode
    }
}

module.exports = CodeUtil();