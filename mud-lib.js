/**
 * 
 * 
 * @param {any} client
 * @param {any} constants
 * @param {any} codeutil
 * @returns
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