var chai = require('chai');
var expect = chai.expect;
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

var goblinCaveNoSize = {
    areacode: "GCV",
    name: "Goblin Cave",
    description: "A cave filled with goblins."
};

var koboldValleyUpdate = {
    name: "Kobold Death Valley",
    description: "A hot, dry valley filled with undead Kobolds."
};

var koboldAreaUpdated = {
    areacode: "KDV",
    name: "Kobold Death Valley",
    description: "A hot, dry valley filled with undead Kobolds.",
    size: 0
};

var hashKey = codeutil.buildCode(constants.AREAS_KEY, koboldValleyArea.areacode);

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
            lib.area.createArea(koboldValleyArea.areacode, koboldValleyArea, function() {
                done();
            });
        });

        it('Checks setting of both data pieces', function(done) {
            lib.area.createArea(goblinCaveArea.areacode, goblinCaveArea, function(success) {
                client.multi()
                    .sismember(constants.AREAS_KEY, goblinCaveArea.areacode)
                    .hmget(hashKey, 'areacode')
                    .exec(function(err, res) {
                        expect(res[0]).to.equal(1);
                        expect(res[1]).to.be.a('Array');
                        expect(res[1]).to.have.length(1);
                        expect(res[1]).to.deep.equal([koboldValleyArea.areacode]);
                        done();
                    });
            });
        });

        it('areaCode and areaData.areacode need to match.', function() {
            lib.area.createArea('a', koboldValleyArea, function(success) {
                expect(success).to.equal(false);
            });
        });

        it('Create data for area with undefined size and verify size = 0', function(done) {
            var test3Key = codeutil.buildCode(constants.AREAS_KEY, goblinCaveNoSize.areacode);
            lib.area.createArea(goblinCaveNoSize.areacode, goblinCaveNoSize, function(success) {
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
            lib.area.createArea(koboldValleyArea.areacode, koboldValleyArea, function() {
                done();
            });
        });

        var areaArray = [koboldValleyArea.areacode];

        it('Retrieve list of all areas', function(done) {
            lib.area.getAreas(function(res) {
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
            lib.area.createArea(koboldValleyArea.areacode, koboldValleyArea, function() {
                done();
            });
        });

        var areaKey = codeutil.buildAreaCode(koboldValleyArea.areacode);
        it('Read data for one area', function(done) {
            lib.area.getArea(areaKey, function(res) {
                expect(res).to.deep.equal(koboldValleyArea);
                done();
            });
        });

        it('Read data for area with size > 0 and verify size', function(done) {
            var areaKey = codeutil.buildAreaCode(koboldValleyArea.areacode);

            client.hincrby(areaKey, 'size', 5, function(herr, hres) {
                lib.area.getArea(koboldValleyArea.areacode, function(res) {
                    expect(res.size).to.equal(5);
                    done();
                });
            });
        });
    });

    describe('Check area exists', function() {
        beforeEach(function(done) {
            lib.area.createArea(koboldValleyArea.areacode, koboldValleyArea, function() {
                done();
            });
        });

        it('Area does exist.', function(done) {
            lib.area.areaExists(koboldValleyArea.areacode, function(exists) {
                assert(exists);
                done();
            });
        });

        it('Area does not exist.', function(done) {
            lib.area.areaExists('XXX', function(exists) {
                assert(!exists);
                done();
            });
        });
    });

    // U
    describe('Update one area', function() {
        beforeEach(function(done) {
            lib.area.createArea(koboldValleyArea.areacode, koboldValleyArea, function() {
                done();
            });
        });

        it('Update data for one area.', function(done) {
            lib.area.setArea(koboldValleyArea.areacode, koboldValleyUpdate, function(area) {
                expect(area).to.deep.equal(koboldAreaUpdated);
                done();
            });
        });
    });

    describe('Attempt to update a non-existant area', function() {
        beforeEach(function(done) {
            lib.area.createArea(koboldValleyArea.areacode, koboldValleyArea, function() {
                done();
            });
        });

        it('Update area that does not exist.', function(done) {
            var newArea = {
                areacode: "XXX",
                name: "Kobold Death Valley",
                description: "A hot, dry valley filled with undead Kobolds."
            };

            lib.area.setArea(newArea.areacode, newArea, function(err) {
                expect(err).to.not.equal(null);
                expect(err).to.equal(constants.errors.UPDATE_AREACODE_NO_EXIST);
                done();
            });

        });
    });

    describe('Argument mangling', function() {
        beforeEach(function(done) {
            lib.area.createArea(koboldValleyArea.areacode, koboldValleyArea, function() {
                done();
            });
        });

        it('Check callback for argument mangling.', function(done) {
            var areaUpdate = Object.assign({}, koboldValleyArea);

            lib.area.setArea(koboldValleyArea.areacode, areaUpdate, function(err) {
                expect(areaUpdate).to.deep.equal(koboldValleyArea);
                done();
            });
        });

        it('Check async promise for argument mangling.', function() {
            var areaUpdate = Object.assign({}, koboldValleyArea);

            return lib.area.async.setArea(koboldValleyArea.areacode, areaUpdate)
                .then(function(status) {
                    expect(areaUpdate).to.deep.equal(koboldValleyArea);
                });
        });
    });

    // D
    describe('Delete an existing area', function() {
        beforeEach(function(done) {
            lib.area.createArea(koboldValleyArea.areacode, koboldValleyArea, function() {
                done();
            });
        });

        it('Checks delete of both data pieces', function(done) {
            lib.area.deleteArea(koboldValleyArea.areacode);

            assert(client.sismember(constants.AREAS_KEY, koboldValleyArea.areacode, function(err, res) {
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