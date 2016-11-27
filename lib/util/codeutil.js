/**
 * Simple Code Utility library.
 * "Code"s are the identifier codes the game uses to store data in the database.
 * 
 * @namespace util
 * @returns An access object.
 */
function CodeUtil() {
    var constants = require('../constants.js');

    // Build functions

    /**
     * Base code building function. Other functions call this.
     * 
     * @memberof util
     * @param {arguments:any} Passed arguments must be castable to string through a toString() function.
     * @returns Joins all argument values with colons.
     */
    function BuildCode() {
        var args = [];
        for (i = 0; i < arguments.length; i++)
            args.push(arguments[i].toString());
        return args.join(":");
    }

    /**
     * Builds an area code.
     * Area codes are prefaced with the AREAS: key.
     * If the passed area code already begins with AREAS:, no further building will occur.
     * 
     * @memberof util
     * @param {any} areaCode The code to append to AREAS:
     * @returns A fully-formatted area code.
     */
    function BuildAreaCode(areaCode) {
        // If areaCode starts with 'AREAS:', just return the areaCode
        if (areaCode.search(constants.AREAS_KEY + ':') === 0) {
            return areaCode;
        } else {
            return BuildCode(constants.AREAS_KEY, areaCode);
        }
    }

    /**
     * Builds a room code.
     * 
     * @memberof util
     * @param {any} areaCode The room's area.
     * @param {number} roomNumber The room's number.
     * @returns A fully-formed room code.
     */
    function BuildRoomCode(areaCode, roomNumber) {
        if (typeof(roomNumber) != 'number') {
            throw "number expected";
        }
        return BuildCode(constants.ROOMS_KEY, areaCode, roomNumber);
    }

    /**
     * Builds a user key.
     * 
     * @memberof util
     * @param {string} username The user's name.
     * @returns A fully-formed user code.
     */
    function BuildUserCode(username) {
        return BuildCode(constants.USER_KEY, username);
    }


    /**
     * Builds a user characters key.
     * 
     * @memberof util
     * @param {string} username The user's name.
     * @returns A fully-formed user characters key.
     */
    function BuildUserCharacterCode(username) {
        return BuildCode(constants.USER_KEY, username, constants.USER_CHARACTERS_KEY);
    }

    /**
     * Builds a character key.
     * 
     * @param {string} characterName The character's name.
     * @returns A fully-formed character key.
     */
    function BuildCharacterCode(characterName) {
        return BuildCode(constants.CHARACTER_KEY, characterName);
    }

    /**
     * Builds a room exits code.
     * 
     * @memberof util
     * @param {any} areaCode The room's area.
     * @param {number} roomNumber The room's number.
     * @returns A fully-formed room exits code.
     */
    function BuildRoomExitsCode(areaCode, roomNumber) {
        if (typeof(roomNumber) != 'number') {
            throw "number expected";
        }
        return BuildCode(constants.ROOMS_KEY, areaCode, roomNumber, constants.ROOMS_EXIT_KEY);
    }

    /**
     * Converts a room code to a room exits code.
     * 
     * @memberof util
     * @param {any} roomCode Any fully formed room code.
     * @returns A fully formed room exits code.
     */
    function ConvertRoomToExitsCode(roomCode) {
        return BuildCode(roomCode, constants.ROOMS_EXIT_KEY);
    }

    // Extract functions

    /**
     * Extract an area code from a fully formed area code.
     * 
     * @memberof util
     * @param {any} areaCode The area code to extract from.
     * @returns The extracted area code.
     */
    function ExtractAreaCode(areaCode) {
        var areaCodeBase = constants.AREAS_KEY + ':';
        if (areaCode.search(areaCodeBase) === 0) {
            return areaCode.substr(areaCodeBase.length);
        } else {
            return areaCode;
        }
    }

    return {
        buildCode: BuildCode,
        buildAreaCode: BuildAreaCode,
        buildRoomCode: BuildRoomCode,
        buildRoomExitsCode: BuildRoomExitsCode,
        buildUserCode: BuildUserCode,
        buildUserCharacterCode: BuildUserCharacterCode,
        buildCharacterCode: BuildCharacterCode,

        convertRoomToExitsCode: ConvertRoomToExitsCode,

        extractAreaCode: ExtractAreaCode
    };
}

module.exports = CodeUtil();