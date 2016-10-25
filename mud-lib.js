/**
 * A library for interfacing with the RedMUD's Redis backend.
 * 
 * @param {any} client The client object used by the library instance.
 * @returns A function-access object.
 */
function MUDLib(client) {
    var libs = [];
    libs.push(require('./lib/area/area-lib')(client));
    libs.push(require('./lib/room/room-lib')(client));

    var mudLib = {};

    for (var i = 0; i < libs.length; i++) {
        var lib = libs[i];

        for (var func in lib) {
            mudLib[func] = lib[func];
        }
    }

    return mudLib;
}

module.exports = MUDLib;