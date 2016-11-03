var chai = require('chai');
var expect = chai.expect;
var should = chai.should();
var assert = require('assert');

var redis = require('redis');
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
    beforeEach(function(done) {
        client.flushall();
        lib.createArea(koboldValleyArea.areacode, koboldValleyArea, function() {
            lib.createArea(goblinValleyArea.areacode, goblinValleyArea, function() {
                lib.reserveRoomNumber(koboldValleyArea.areacode, function(roomNumber) {
                    westernOverlook.roomnumber = roomNumber;
                    lib.setRoom(koboldValleyArea.areacode, roomNumber, westernOverlook);
                    done();
                });
            });
        });
    });

    after(function(done) {
        client.flushall();
        done();
    });

    // C
    describe('Create a new room without exits', function() {
        it('Create goblin cave entrance through reserveRoomNumber and setRoom', function(done) {
            lib.reserveRoomNumber(goblinValleyArea.areacode, function(roomNumber) {
                goblinCaveEntrance.roomnumber = roomNumber;
                lib.setRoom(goblinValleyArea.areacode, roomNumber, goblinCaveEntrance, function() {
                    client.hgetall(codeutil.buildRoomCode(goblinCaveEntrance.areacode, roomNumber), function(err, res) {
                        if (typeof(res.roomnumber) === 'string') {
                            res.roomnumber = parseInt(res.roomnumber, 10);
                        }
                        expect(res).to.deep.equal(goblinCaveEntrance);
                        done();
                    });
                });
            });
        });

        it('Create goblin cave entrance through addRoom', function(done) {
            lib.addRoom(goblinValleyArea.areacode, goblinCaveEntrance, function(roomNumber) {
                client.hgetall(codeutil.buildRoomCode(goblinCaveEntrance.areacode, roomNumber), function(err, res) {
                    if (typeof(res.roomnumber) === 'string') {
                        res.roomnumber = parseInt(res.roomnumber, 10);
                    }
                    expect(res).to.deep.equal(goblinCaveEntrance);
                    done();
                });
            });
        });
    });

    // R
    describe('Read rooms', function() {
        it('Read the western overlook.', function(done) {
            lib.getRoom(westernOverlook.areacode, westernOverlook.roomnumber, function(roomData) {
                expect(roomData).to.deep.equal(westernOverlook);
                done();
            });
        });

        it('Read the western overlook after joining it to the goblin cave entrance.', function(done) {
            lib.addRoom(goblinCaveEntrance.areacode, goblinCaveEntrance);

            should.not.exist(westernOverlook.exits);
            should.not.exist(goblinCaveEntrance.exits);

            var exitDir = 'west';

            lib.setConnection(exitDir, westernOverlook, goblinCaveEntrance, function() {
                var roomCode = codeutil.buildRoomCode(westernOverlook.areacode, westernOverlook.roomnumber);
                var roomExitsCode = codeutil.convertRoomToExitsCode(roomCode);
                var destinationCode = codeutil.buildRoomCode(goblinCaveEntrance.areacode, goblinCaveEntrance.roomnumber);

                lib.getRoom(westernOverlook.areacode, westernOverlook.roomnumber, function(roomData) {
                    should.exist(roomData.exits);
                    expect(roomData.exits).to.be.a('object');
                    expect(roomData.exits[exitDir]).to.equal(destinationCode);

                    done();
                });
            });
        });
    });

    // U
    describe('Update room data', function() {
        it('Update the western overlook', function(done) {
            westernOverlookUpdated.roomnumber = westernOverlook.roomnumber;

            lib.setRoom(westernOverlook.areacode, westernOverlook.roomnumber, westernOverlookUpdate, function() {
                lib.getRoom(westernOverlook.areacode, westernOverlook.roomnumber, function(roomData) {
                    expect(roomData).to.deep.equal(westernOverlookUpdated);
                    done();
                });
            });
        });

        it('Add an exit from western overlook to goblin cave entrance', function(done) {
            lib.addRoom(goblinCaveEntrance.areacode, goblinCaveEntrance);

            should.not.exist(westernOverlook.exits);
            should.not.exist(goblinCaveEntrance.exits);

            var exitDir = 'west';

            lib.setConnection(exitDir, westernOverlook, goblinCaveEntrance, function() {
                var roomCode = codeutil.buildRoomCode(westernOverlook.areacode, westernOverlook.roomnumber);
                var roomExitsCode = codeutil.convertRoomToExitsCode(roomCode);
                var destinationCode = codeutil.buildRoomCode(goblinCaveEntrance.areacode, goblinCaveEntrance.roomnumber);

                client.hgetall(roomExitsCode, function(err, res) {
                    expect(res[exitDir]).to.equal(destinationCode);
                    done();
                });
            });
        });

        it('Connect the western overlook to the goblin cave entrance', function(done) {
            lib.addRoom(goblinCaveEntrance.areacode, goblinCaveEntrance);

            should.not.exist(westernOverlook.exits);
            should.not.exist(goblinCaveEntrance.exits);

            var wolExit = {
                source: westernOverlook,
                command: 'west'
            };

            var gcvExit = {
                source: goblinCaveEntrance,
                command: 'east'
            };

            lib.connectRooms(wolExit, gcvExit, function() {
                var wolCode = codeutil.buildRoomCode(westernOverlook.areacode, westernOverlook.roomnumber);
                var wolECode = codeutil.convertRoomToExitsCode(wolCode);
                var gcvCode = codeutil.buildRoomCode(goblinCaveEntrance.areacode, goblinCaveEntrance.roomnumber);
                var gcvECode = codeutil.convertRoomToExitsCode(gcvCode);

                client.hget(wolECode, wolExit.command, function(werr, wres) {
                    expect(wres).to.equal(gcvCode);
                    client.hget(gcvECode, gcvExit.command, function(gerr, gres) {
                        expect(gres).to.equal(wolCode);
                        done();
                    });
                });
            })
        });
    });

    // D
    describe('Delete a room', function() {
        it('Delete the western overlook and the kobold valley', function(done) {
            lib.deleteRoom(westernOverlook.areacode, westernOverlook.roomnumber, function(delResponse) {
                expect(delResponse).to.be.a('object');
                expect(delResponse.code).to.equal(constants.AREA_DELETED);

                lib.getRoom(westernOverlook.areacode, westernOverlook.roomnumber, function(roomData) {
                    expect(roomData).to.equal(null);

                    lib.getArea(westernOverlook.areacode, function(area) {
                        expect(area).to.equal(null);
                        done();
                    });
                });
            });
        });

        it('Delete one out of two rooms in the goblin cave', function(done) {
            lib.addRoom(goblinCaveEntrance.areacode, goblinCaveEntrance);
            lib.addRoom(goblinCaveTunnel.areacode, goblinCaveTunnel);

            lib.deleteRoom(goblinCaveEntrance.areacode, goblinCaveEntrance.roomnumber, function(delResponse) {
                expect(delResponse).to.be.a('object');
                expect(delResponse.code).to.equal(constants.OK);
                done();
            });
        });
    });
});