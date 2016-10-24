/**
 * 
 * 
 * @param {any} client
 * @param {any} constants
 * @param {any} codeutil
 * @returns
 */
function MUDLib(client, constants, codeutil) {
    var libs = [];
    libs.push(require('./area/area-lib')(client, constants, codeutil));
    libs.push(require('./room/room-lib')(client, constants, codeutil));

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