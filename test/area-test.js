var chai = require('chai');
var expect = chai.expect;
var assert = require('assert');

var redis = require('redis');
var constants = require('../lib/constants');
var codeutil = require('../lib/util/codeutil');

var client = redis.createClient();

var lib = require('../mud-lib')(client);

var testArea = {
    areacode: "KDV",
    name: "Kobold Valley",
    description: "A valley filled with dangerous Kobolds.",
    size: 0
};

var testArea2 = {
    areacode: "GCV",
    name: "Goblin Cave",
    description: "A cave filled with goblins.",
    size: 0
};

var testAreaUpdate = {
    name: "Kobold Death Valley",
    description: "A hot, dry valley filled with undead Kobolds."
};

var testAreaUpdated = {
    areacode: "KDV",
    name: "Kobold Death Valley",
    description: "A hot, dry valley filled with undead Kobolds.",
    size: 0
};

var hashKey = codeutil.buildCode(constants.AREAS_KEY, testArea.areacode);

// Tests
describe('The area-lib module', function() {
    // Setup
    beforeEach(function(done) {
        client.flushall();
        lib.setArea(testArea.areacode, testArea);
        done();
    });

    after(function(done) {
        client.flushall();
        done();
    });

    // C
    describe('Create a new area', function() {
        it('Checks setting of both data pieces', function(done) {
            lib.setArea(testArea2.areacode, testArea2);

            assert(client.sismember(constants.AREAS_KEY, testArea2.areacode, function(err, res) {
                expect(res).to.equal(1);
                done();
            }));

            assert(client.hmget(hashKey, 'areacode', function(err, res) {
                expect(res).to.be.a('object');
                expect(res).to.have.length(1);
                expect(res).to.equal(testArea.areacode);
                done();
            }));
        });

        it('areaCode and areaData.areacode need to match.', function() {
            expect(lib.setArea('a', testArea)).to.equal(false);
        });
    });

    // R
    describe('Read area list', function() {
        lib.setArea(testArea2.areacode, testArea2);
        var areaArray = [testArea.areacode];

        it('Retrieve list of all areas', function(done) {
            lib.getAreas(function(res) {
                expect(res).to.have.length(areaArray.length);
                for (var idx in areaArray) {
                    expect(res).to.contain(areaArray[idx]);
                }
                done();
            });
        });
    });

    describe('Read one area', function() {
        var areaKey = codeutil.buildAreaCode(testArea.areacode);
        it('Read data for one area', function(done) {
            lib.getArea(areaKey, function(res) {
                expect(res).to.deep.equal(testArea);
                done();
            });
        });
    });

    // U
    describe('Update one area', function() {
        it('Update data for one area.', function(done) {
            lib.setArea(testArea.areacode, testAreaUpdate);

            lib.getArea(testArea.areacode, function(res) {
                expect(res).to.deep.equal(testAreaUpdated);
                done();
            });
        });
    });

    // D
    describe('Delete an existing area', function() {
        it('Checks delete of both data pieces', function(done) {
            lib.deleteArea(testArea.areacode);

            assert(client.sismember(constants.AREAS_KEY, testArea.areacode, function(err, res) {
                expect(res).to.equal(0);
                done();
            }));

            assert(client.hkeys(hashKey, function(err, res) {
                expect(res).to.be.a('object');
                expect(res).to.have.length(0);
                done();
            }));
        });
    });
});