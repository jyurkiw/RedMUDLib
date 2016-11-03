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

var testArea3 = {
    areacode: "GCV",
    name: "Goblin Cave",
    description: "A cave filled with goblins."
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
        done();
    });

    after(function(done) {
        client.flushall();
        done();
    });

    // C
    describe('Create a new area', function() {
        beforeEach(function(done) {
            lib.createArea(testArea.areacode, testArea, function() {
                done();
            });
        });

        it('Checks setting of both data pieces', function(done) {
            lib.createArea(testArea2.areacode, testArea2, function(success) {
                client.multi()
                    .sismember(constants.AREAS_KEY, testArea2.areacode)
                    .hmget(hashKey, 'areacode')
                    .exec(function(err, res) {
                        expect(res[0]).to.equal(1);
                        expect(res[1]).to.be.a('Array');
                        expect(res[1]).to.have.length(1);
                        expect(res[1]).to.deep.equal([testArea.areacode]);
                        done();
                    });
            });
        });

        it('areaCode and areaData.areacode need to match.', function() {
            lib.createArea('a', testArea, function(success) {
                expect(success).to.equal(false);
            });
        });

        it('Create data for area with undefined size and verify size = 0', function(done) {
            var test3Key = codeutil.buildCode(constants.AREAS_KEY, testArea3.areacode);
            lib.createArea(testArea3.areacode, testArea3, function(success) {
                client.hmget(test3Key, 'size', function(err, res) {
                    expect(res).to.have.length(1);
                    expect(parseInt(res[0], 10)).to.equal(0);
                    done();
                });
            });
        });
    });

    // R
    describe('Read area list', function() {
        beforeEach(function(done) {
            lib.createArea(testArea.areacode, testArea, function() {
                done();
            });
        });

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
        beforeEach(function(done) {
            lib.createArea(testArea.areacode, testArea, function() {
                done();
            });
        });

        var areaKey = codeutil.buildAreaCode(testArea.areacode);
        it('Read data for one area', function(done) {
            lib.getArea(areaKey, function(res) {
                expect(res).to.deep.equal(testArea);
                done();
            });
        });

        it('Read data for area with size > 0 and verify size', function(done) {
            var areaKey = codeutil.buildAreaCode(testArea.areacode);

            client.hincrby(areaKey, 'size', 5, function(herr, hres) {
                lib.getArea(testArea.areacode, function(res) {
                    expect(res.size).to.equal(5);
                    done();
                });
            });
        });
    });

    describe('Check area exists', function() {
        beforeEach(function(done) {
            lib.createArea(testArea.areacode, testArea, function() {
                done();
            });
        });

        it('Area does exist.', function(done) {
            lib.areaExists(testArea.areacode, function(exists) {
                assert(exists);
                done();
            });
        });

        it('Area does not exist.', function(done) {
            lib.areaExists('XXX', function(exists) {
                assert(!exists);
                done();
            });
        });
    });

    // U
    describe('Update one area', function() {
        beforeEach(function(done) {
            lib.createArea(testArea.areacode, testArea, function() {
                done();
            });
        });

        it('Update data for one area.', function(done) {
            lib.setArea(testArea.areacode, testAreaUpdate, function(area) {
                expect(area).to.deep.equal(testAreaUpdated);
                done();
            });
        });
    });

    describe('Attempt to update a non-existant area', function() {
        beforeEach(function(done) {
            lib.createArea(testArea.areacode, testArea, function() {
                done();
            });
        });

        it('Update area that does not exist.', function(done) {
            var newArea = {
                areacode: "XXX",
                name: "Kobold Death Valley",
                description: "A hot, dry valley filled with undead Kobolds."
            };

            lib.setArea(newArea.areacode, newArea, function(err) {
                expect(err).to.not.equal(null);
                expect(err).to.equal(constants.errors.UPDATE_AREACODE_NO_EXIST);
                done();
            });

        });
    });

    // D
    describe('Delete an existing area', function() {
        beforeEach(function(done) {
            lib.createArea(testArea.areacode, testArea, function() {
                done();
            });
        });

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