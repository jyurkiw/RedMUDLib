function RoomUtil(client) {
    var constants = require('./serverconstants.js');

    // Check existance of the room codes in the provided exit data.
    // Returns the keys compiled from the passed exit data.
    function ValidateExits(exitData, callback) {
        // Assemble array of keys and sort to ensure order.
        var exitKeys = [];
        for (exitKey in exitData) {
            exitKeys.push(exitKey);
        }
        exitKeys.sort();

        var validator = client.multi();
        for (exitKey in exitKeys) {
            validator.exists(exitData[exitKeys[exitKey]]);
        }
        validator.execAsync().then(callback);

        return exitKeys;
    };

    return {
        validateExits: ValidateExits
    }
}

module.exports = RoomUtil;