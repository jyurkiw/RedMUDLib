var chai = require('chai');
var expect = chai.expect;
var should = chai.should();
var assert = require('assert');

var redis = require('redis');

// Promisify redis
var bluebird = require('bluebird');
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

var constants = require('../lib/constants');
var codeutil = require('../lib/util/codeutil');

var client = redis.createClient();

var lib = require('../mud-lib')(client);

var koboldValleyArea = {
    areacode: 'KDV',
    name: "Kobold Valley",
    description: "A valley filled with dangerous Kobolds.",
    size: 0
};

var goblinValleyArea = {
    areacode: 'GCV',
    name: "Goblin Cave",
    description: "A cave filled with goblins.",
    size: 0
};

var westernOverlook = {
    areacode: koboldValleyArea.areacode,
    roomnumber: 1,
    name: 'Western Overlook',
    description: 'A short cliff overlooks a small, fertile valley. You can see scores of Kobolds milling about doing whatever it is Kobolds do.'
};

var goblinCaveEntrance = {
    areacode: goblinValleyArea.areacode,
    roomnumber: 1,
    name: 'Cave Entrance',
    description: 'The opening to this dank cave reeks of Goblin.'
};

var goblinCaveTunnel = {
    areacode: goblinValleyArea.areacode,
    roomnumber: 2,
    name: 'Narrow Corridor',
    description: 'The cave stretches on into the darkness. '
};

var westernOverlookUpdate = {
    name: 'Western Overlook',
    description: 'A short cliff overlooks a small, fertile valley. You can see scores of Kobolds milling about doing whatever it is Kobolds do. A hole in the western rockface opens into a dark cave that reeks of Goblin.'
};

var westernOverlookUpdated = {
    areacode: 'KDV',
    roomnumber: 1,
    name: 'Western Overlook',
    description: 'A short cliff overlooks a small, fertile valley. You can see scores of Kobolds milling about doing whatever it is Kobolds do. A hole in the western rockface opens into a dark cave that reeks of Goblin.'
};

// Tests
describe('The room-lib module', function() {
    // Setup
    beforeEach(function() {
        return Promise.all([
            client.flushallAsync(),
            lib.areas.async.createArea(koboldValleyArea.areacode, koboldValleyArea),
            lib.areas.async.createArea(goblinValleyArea.areacode, goblinValleyArea)
        ]);
    });

    after(function() {
        return client.flushallAsync();
    });

    // C
    describe('Create a new room without exits', function() {
        it('Create goblin cave entrance', function() {
            return lib.area.async.createRoom(goblinCaveEntrance.areacode, goblinCaveEntrance)
                .then(function() {
                    return client.hgetallAsync(codeutil.buildRoomCode(goblinCaveEntrance.areacode, roomNumber))
                        .then(function(room) {
                            if (typeof(res.roomnumber) === 'string') {
                                res.roomnumber = parseInt(res.roomnumber, 10);
                            }
                            expect(res).to.deep.equal(goblinCaveEntrance);
                        });
                });
        });

        it('Create goblin cave entrance through addRoom', function() {

        });
    });

    // R
    describe('Read rooms', function() {
        it('Read the western overlook.', function() {

        });

        it('Read the western overlook after joining it to the goblin cave entrance.', function() {

        });
    });

    // U
    describe('Update room data', function() {
        it('Update the western overlook', function() {

        });

        it('Add an exit from western overlook to goblin cave entrance', function() {

        });

        it('Connect the western overlook to the goblin cave entrance', function() {

        });

        it('Check for update argument mangling', function() {

        });
    });

    // D
    describe('Delete a room', function() {
        it('Delete the western overlook and the kobold valley', function() {

        });

        it('Delete one out of two rooms in the goblin cave', function() {

        });
    });
});