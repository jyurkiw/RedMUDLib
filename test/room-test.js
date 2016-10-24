var chai = require('chai');
var expect = chai.expect;
var assert = require('assert');

var redis = require('redis');
var constants = require('../lib/constants');
var codeutil = require('../lib/util/codeutil');

var client = redis.createClient();

var lib = require('../lib/mud-lib')(client);

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

var westernOverlookAdd = {
    areacode: koboldValleyArea.areacode,
    name: 'Western Overlook',
    description: 'A short cliff overlooks a small, fertile valley. You can see scores of Kobolds milling about doing whatever it is Kobolds do.'
};

var westernOverlook = {
    areacode: koboldValleyArea.areacode,
    roomnumber: 1,
    name: 'Western Overlook',
    description: 'A short cliff overlooks a small, fertile valley. You can see scores of Kobolds milling about doing whatever it is Kobolds do.'
};

var goblinCaveEntranceAdd = {
    areacode: goblinValleyArea.areacode,
    name: 'Cave Entrance',
    description: 'The opening to this dank cave reeks of Goblin.'
};

var goblinCaveEntrance = {
    areacode: goblinValleyArea.areacode,
    roomnumber: 1,
    name: 'Cave Entrance',
    description: 'The opening to this dank cave reeks of Goblin.'
}

var goblinCaveTunnelAdd = {
    areacode: goblinValleyArea.areacode,
    name: 'Narrow Corridor',
    description: 'The cave stretches on into the darkness. '
}

var goblinCaveTunnel = {
    areacode: goblinValleyArea.areacode,
    roomnumber: 2,
    name: 'Narrow Corridor',
    description: 'The cave stretches on into the darkness. '
}

var westernOverlookUpdate = {
    name: 'Western Overlook',
    description: 'A short cliff overlooks a small, fertile valley. You can see scores of Kobolds milling about doing whatever it is Kobolds do. A hole in the wester rockface opens into a dark cave that reeks of Goblin.'
};

var westernOverlookUpdated = {
    areacode: 'KDV',
    roomnumber: 1,
    name: 'Western Overlook',
    description: 'A short cliff overlooks a small, fertile valley. You can see scores of Kobolds milling about doing whatever it is Kobolds do. A hole in the wester rockface opens into a dark cave that reeks of Goblin.'
};

// Setup
beforeEach(function(done) {
    client.flushall();
    lib.setArea(koboldValleyArea.areacode, koboldValleyArea);
    lib.setArea(goblinValleyArea.areacode, goblinValleyArea);
    lib.addRoom(koboldValleyArea.areacode, westernOverlookAdd);
    done();
});

after(function(done) {
    client.flushall();
    done();
});

// Tests
describe('The room-lib module', function() {
    // C
    describe('Create a new room without exits', function() {
        it('Checks setting of all data pieces with basic area code', function(done) {
            lib.addRoom(goblinCaveEntranceAdd.areacode, goblinCaveEntranceAdd, function(fullRoomData, newRoomNumber) {
                expect(newRoomNumber).to.equal(goblinCaveEntrance.roomnumber);
                expect(fullRoomData).to.deep.equal(goblinCaveEntrance);
                done();
            });
        });

        it('Checks setting of all data pieces with area key', function(done) {
            var areaCode = codeutil.buildAreaCode(goblinCaveEntranceAdd.areacode, goblinCaveEntranceAdd);

            lib.addRoom(areaCode, goblinCaveEntranceAdd, function(fullRoomData, newRoomNumber) {
                expect(newRoomNumber).to.equal(goblinCaveEntrance.roomnumber);
                expect(fullRoomData).to.deep.equal(goblinCaveEntrance);
                done();
            });
        });
    });

    // R
    describe('Read rooms', function() {
        it('Get the western overlook', function(done) {
            lib.getRoom(westernOverlook.areacode, westernOverlook.roomnumber, function(room) {
                expect(room).to.deep.equal(westernOverlook);
                done();
            });
        });
    });

    // U
    describe('Update a room data', function() {

    });

    // D
    describe('Delete a room', function() {

    });

});