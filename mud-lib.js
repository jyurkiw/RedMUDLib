/**
 * A library for interfacing with the RedMUD's Redis backend.
 * 
 * @param {any} client The client object used by the library instance.
 * @returns A function-access object.
 */
function MUDLib() {
    var redis = require('redis');
    var bluebird = require('bluebird');

    // Promisify the redis client
    bluebird.promisifyAll(redis.RedisClient.prototype);
    bluebird.promisifyAll(redis.Multi.prototype);

    var client = redis.createClient();

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

    mudLib.client = { instance: function getInstance() { return client; } };

    return mudLib;
}

module.exports = MUDLib;