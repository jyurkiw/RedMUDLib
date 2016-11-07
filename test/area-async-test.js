var chai = require('chai');
var expect = chai.expect;
var should = chai.should();
var assert = require('assert');

//var redis = require('redis');
var constants = require('../lib/constants');
var codeutil = require('../lib/util/codeutil');

var lib = require('../mud-lib')();

//var client = redis.createClient();
var client = lib.client.instance();

var koboldValleyArea = {
    areacode: "KDV",
    name: "Kobold Valley",
    description: "A valley filled with dangerous Kobolds.",
    size: 0
};

var goblinCaveArea = {
    areacode: "GCV",
    name: "Goblin Cave",
    description: "A cave filled with goblins.",
    size: 0
};

var goblinCaveAreaNoSize = {
    areacode: "GCV",
    name: "Goblin Cave",
    description: "A cave filled with goblins."
};

var koboldValleyUpdate = {
    name: "Kobold Death Valley",
    description: "A hot, dry valley filled with undead Kobolds."
};

var koboldValleyAreaUpdated = {
    areacode: "KDV",
    name: "Kobold Death Valley",
    description: "A hot, dry valley filled with undead Kobolds.",
    size: 0
};

// Tests
describe('The area-lib async module', function() {
    // Setup
    beforeEach(function(done) {
        client.flushall();
        done();
    });

    afterEach(function(done) {
        client.flushall();
        done();
    });

    // C
    describe('Create a new area', function() {
        it('Checks setting of both data pieces', function() {
            return lib.area.async.createArea(koboldValleyArea.areacode, koboldValleyArea)
                .then(function(success) {
                    assert(client.sismember(constants.AREAS_KEY, koboldValleyArea.areacode, function(err, res) {
                        assert(success);
                        expect(res).to.equal(1);
                    }));
                })
                .then(function(success) {
                    assert(client.hmget(codeutil.buildCode(constants.AREAS_KEY, koboldValleyArea.areacode), 'areacode', function(err, res) {
                        expect(res).to.be.a('object');
                        expect(res).to.have.length(1);
                        expect(res).to.equal(koboldValleyArea.areacode);
                    }));
                });
        });

        it('areaCode and areaData.areacode need to match.', function() {
            return lib.area.async.createArea('a', koboldValleyArea)
                .catch(function(err, msg) {
                    expect(err).to.be.a('string');
                    expect(err).to.equal(constants.errors.CREATE_AREACODE_NO_EXIST_IN_PAYLOAD);
                });
        });

        it('Create data for area with undefined size and verify size = 0', function() {
            var goblinCaveNoSizeKey = codeutil.buildCode(constants.AREAS_KEY, goblinCaveAreaNoSize.areacode);
            return lib.area.async.createArea(goblinCaveAreaNoSize.areacode, goblinCaveAreaNoSize)
                .then(function(success) {
                    expect(success).to.equal(true);
                    assert(client.hmget(goblinCaveNoSizeKey, 'size', function(err, res) {
                        expect(res).to.have.length(1);
                        expect(parseInt(res[0], 10)).to.equal(0);
                    }));
                });
        });
    });

    // R
    describe('Read area list', function() {
        beforeEach(function() {
            return Promise.all([
                lib.area.async.createArea(koboldValleyArea.areacode, koboldValleyArea),
                lib.area.async.createArea(goblinCaveArea.areacode, goblinCaveArea)
            ]);
        });

        it('Retrieve list of all areas', function() {
            var areaList = [koboldValleyArea.areacode, goblinCaveArea.areacode].sort();

            return lib.area.async.getAreas()
                .then(function(res) {
                    expect(res).to.have.length(areaList.length);
                    expect(res.sort()).to.deep.equal(areaList);
                });
        });
    });

    describe('Read one area', function() {
        beforeEach(function() {
            return lib.area.async.createArea(koboldValleyArea.areacode, koboldValleyArea);
        });

        it('Read data for one area', function() {
            return lib.area.async.getArea(koboldValleyArea.areacode)
                .then(function(area) {
                    expect(area).to.deep.equal(koboldValleyArea);
                });
        });
        it('Read data for area with size > 0 and verify size', function() {
            client.hincrby('AREAS:' + koboldValleyArea.areacode, 'size', 5, function(herr, hres) {
                expect(hres).to.equal(5);
                return lib.area.async.getArea(koboldValleyArea.areacode)
                    .then(function(area) {

                        expect(area).to.be.a('object');
                        should.exist(area.size);
                        expect(area.size).to.equal(5);
                    });
            });
        });
    });

    describe('Check area exists', function() {
        beforeEach(function() {
            return lib.area.async.createArea(koboldValleyArea.areacode, koboldValleyArea);
        });

        it('Area does exist.', function() {
            return lib.area.async.areaExists(koboldValleyArea.areacode)
                .then(function(exists) {
                    assert(exists);
                });
        });

        it('Area does not exist.', function() {
            return lib.area.async.areaExists('XXX')
                .then(function(exists) {
                    assert(!exists);
                });
        });
    });

    // U
    describe('Update one area', function() {
        beforeEach(function() {
            return lib.area.async.createArea(koboldValleyArea.areacode, koboldValleyArea);
        });

        it('Update data for one area.', function() {
            return lib.area.async.setArea(koboldValleyArea.areacode, koboldValleyUpdate)
                .then(function() {
                    lib.area.async.getArea(koboldValleyArea.areacode)
                        .then(function(area) {
                            expect(area).to.deep.equal(koboldValleyAreaUpdated);
                        });
                });
        });
    });

    describe('Update one area', function() {
        it('Update data for one area that does not exist (update should fail).', function() {
            return lib.area.async.setArea(koboldValleyArea.areacode, koboldValleyUpdate)
                .then(function(success) {
                    assert(0, 1, constants.errors.UPDATE_AREACODE_NO_EXIST);
                })
                .catch(function(err) {
                    expect(err).to.equal(constants.errors.UPDATE_AREACODE_NO_EXIST);
                });
        });
    });

    // D
    describe('Delete an existing area', function() {
        beforeEach(function() {
            return lib.area.async.createArea(koboldValleyArea.areacode, koboldValleyArea);
        });

        it('Checks delete of both data pieces', function() {
            return lib.area.async.deleteArea(koboldValleyArea.areacode)
                .then(function(success) {
                    expect(success).to.equal(true);
                    assert(client.sismember(constants.AREAS_KEY, koboldValleyArea.areacode, function(err, res) {
                        expect(res).to.equal(0);
                    }));
                })
                .then(function() {
                    assert(client.hkeys(codeutil.buildCode(constants.AREAS_KEY, koboldValleyArea.areacode), function(err, res) {
                        expect(res).to.be.a('object');
                        expect(res).to.have.length(0);
                    }));
                });
        });
    });

});