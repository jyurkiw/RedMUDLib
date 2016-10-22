// Node JS MUD server with a Redis backend.
// This is not the API layer. The API will create a server object, and
// interact with the game through the exposed game server API.
function NodeMUDServer() {
    // The game server uses Redis to store data.
    var redis = require('redis');

    // Some requires
    var bluebird = require('bluebird');
    var constants = require('./serverconstants');
    var codeutil = require('./codeutil');

    // promisify redis
    bluebird.promisifyAll(redis.RedisClient.prototype);
    bluebird.promisifyAll(redis.Multi.prototype);

    var client = redis.createClient(); // create a new client

    // client object dependent requires
    var roomutil = require('./roomutil')(client);

    client.once('connect', function(err) {
        if (typeof(err) !== 'undefined') {
            console.log(err);
        }
    });

    // Handle signal interuption because Windows doesn't.
    if (process.platform === "win32") {
        var rl = require("readline").createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.on("SIGINT", function() {
            process.emit("SIGINT");
        })
    }

    process.on('SIGINT', function() {
        console.log("Closing Redis Connection...");
        client.quit();

        console.log("Exiting...");
        process.exit();
    });

    return {
        // Areas Get
        getAreas: function getAreas(callback) {
            client.smembersAsync(constants.AREAS_KEY).then(callback);
        },

        // Area Get
        getArea: function getArea(areaCode, callback) {
            client.hgetallAsync(codeutil.buildCode(constants.AREAS_KEY, areaCode)).then(callback);
        },

        // Area Add
        addArea: function addArea(areaData) {
            // Add the new area
            client.hmset(codeutil.buildCode(constants.AREAS_KEY, areaData.areacode), areaData);

            // Add the area to the areas list
            client.sadd(constants.AREAS_KEY, areaData.areacode);
        },

        // Area Delete
        deleteArea: function deleteArea(areaCode) {
            client.del(areaCode);
            client.srem(constants.AREAS_KEY, areaCode);
        },

        // Room Set
        setRoomData: function setRoomData(roomData) {
            // Add the new area
            client.hmset(codeutil.buildRoomCode(roomData.areacode, roomData.number), roomData);
        },

        setRoomExits: function setRoomExits(areaCode, roomNumber, exitData) {
            // validate the exit data
            var exitKeys = roomutil.validateExits(exitData, function(existsArray) {
                if (exitKeys.length != existsArray.length) {
                    return;
                } else {
                    // otherwise, exitKeys and existsArray should be parallel arrays due to
                    // sort order. Delete any elements in exitData that don't actually exist.
                    for (var i = 0; i < exitKeys.length; i++) {
                        if (existsArray[i] == 0) {
                            delete exitData[exitKeys[i]];
                        }
                    }
                }

                client.hmset(codeutil.buildRoomExitsCode(areaCode, roomNumber), exitData);
            });
        },

        // Room Get
        getRoomData: function getRoomData(areaCode, roomNumber, callback) {
            client.multi()
                .hgetall(codeutil.buildRoomCode(areaCode, roomNumber))
                .hgetall(codeutil.buildRoomExitsCode(areaCode, roomNumber))
                .execAsync()
                .then(callback);

            // query index keys. They mark the order of execution in the above
            // execAsync call response.
            return {
                roomDataKey: 0,
                exitDataKey: 1
            }
        },

        // Close the redis connection and exit
        quit: function quit() {
            console.log("Closing Redis Connection...");
            client.quit();

            console.log("Exiting...");
            process.exit();
        }
    }
}

module.exports = NodeMUDServer();