function MUDLib(client, constants, codeutil) {
    var libs = new Array();
    libs.push(require('./area/area-lib')(client, constants, codeutil));
    libs.push(require('./room/room-lib')(client, constants, codeutil));

    var mudLib = new Object();

    for (var i = 0; i < libs.length; i++) {
        var lib = libs[i];

        for (func in lib) {
            mudLib[func] = lib[func];
        }
    }

    return mudLib;
}

module.exports = MUDLib;