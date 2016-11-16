var chai = require('chai');
var expect = chai.expect;
var should = chai.should();
var assert = require('assert');

var constants = require('../lib/constants');
var codeutil = require('../lib/util/codeutil');

var lib = require('../mud-lib')();
var client = lib.client.instance();

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
    description: 'The cave stretches on into the darkness.'
};

describe('Admin functionality APIs', function() {
    before(function() {
        return Promise.all([
                lib.area.async.createArea(koboldValleyArea.areacode, koboldValleyArea),
                lib.area.async.createArea(goblinValleyArea.areacode, goblinValleyArea)
            ])
            .then(function() {
                return Promise.all([
                    lib.room.async.addRoom(westernOverlook.areacode, westernOverlook),
                    lib.room.async.addRoom(goblinCaveEntrance.areacode, goblinCaveEntrance),
                    lib.room.async.addRoom(goblinCaveTunnel.areacode, goblinCaveTunnel)
                ]);
            });
    });

    after(function() {
        return client.flushallAsync();
    });

    it('Get room names and codes for an area', function() {
        var roomDataExpect = {
            'RM:GCV:1': goblinCaveEntrance.roomnumber + ': ' + goblinCaveEntrance.name,
            'RM:GCV:2': goblinCaveTunnel.roomnumber + ': ' + goblinCaveTunnel.name
        };

        return lib.admin.room.async.getRoomLookupTableByArea(goblinCaveEntrance.areacode)
            .then(function(roomData) {
                expect(roomData).to.be.an('object');
                expect(roomData).to.deep.equal(roomDataExpect);
            });
    });

    it('Get room names and codes for all areas', function() {
        var roomDataExpect = {
            'KDV': {
                'RM:KDV:1': westernOverlook.roomnumber + ': ' + westernOverlook.name
            },
            'GCV': {
                'RM:GCV:1': goblinCaveEntrance.roomnumber + ': ' + goblinCaveEntrance.name,
                'RM:GCV:2': goblinCaveTunnel.roomnumber + ': ' + goblinCaveTunnel.name
            }
        };

        return lib.admin.room.async.getAllRoomsLookupTable()
            .then(function(roomData) {
                expect(roomData).to.be.an('object');
                expect(roomData).to.deep.equal(roomDataExpect);
            });
    });
});