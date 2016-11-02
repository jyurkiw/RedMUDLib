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
    before(function(done) {
        client.flushall();
        done();
    });

    after(function(done) {
        client.flushall();
        done();
    });

    // C
    describe('Create a new area', function() {

    });

    // R
    describe('Read area list', function() {
        before(function(done) {
            lib.setArea(koboldValleyArea.areacode, koboldValleyArea);
            lib.setArea(goblinCaveArea.areacode, goblinCaveArea);
            done();
        });

        it('Retrieve list of all areas', function() {
            var areaList = [koboldValleyArea.areacode, goblinCaveArea.areacode].sort();

            lib.getAreasAsync()
                .then(function(res) {
                    expect(res).to.have.length(areaList.length);
                    expect(res.sort()).to.deep.equal(areaList);
                })
                .catch(function(err) {
                    assert.fail(0, 1, err);
                });
        });
    });

    describe('Read one area', function() {
        before(function(done) {
            lib.setArea(koboldValleyArea.areacode, koboldValleyArea);
            done();
        });

        it('Read data for one area', function() {
            lib.getAreaAsync(koboldValleyArea.areacode)
                .then(function(area) {
                    expect(area).to.deep.equal(koboldValleyArea);
                })
                .catch(function(err) {
                    assert.fail(0, 1, err);
                });
        });

        it('Read data for area with size > 0 and verify size', function(done) {
            client.hincrby('AREAS:' + koboldValleyArea.areacode, 'size', 5, function(herr, hres) {
                lib.getAreaAsync(koboldValleyArea.areacode)
                    .then(function(area) {
                        expect(area).to.be.a('object');
                        should.exist(area.size);
                        expect(area.size).to.equal(5);
                    })
                    .catch(function(err) {
                        assert.fail(0, 1, err);
                    });
                done();
            });
        });
    });

    describe('Check area exists', function() {
        before(function(done) {
            lib.setArea(koboldValleyArea.areacode, koboldValleyArea);
            done();
        });

        it('Area does exist.', function() {
            lib.areaExistsAsync(koboldValleyArea.areacode)
                .then(function(exists) {
                    assert(exists);
                });
        });

        it('Area does not exist.', function() {
            lib.areaExistsAsync('XXX')
                .then(function(exists) {
                    assert(!exists);
                });
        });
    });

    // U
    describe('Update one area', function() {

    });

    // D
    describe('Delete an existing area', function() {

    });
});