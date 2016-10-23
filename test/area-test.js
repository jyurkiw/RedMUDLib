var chai = require('chai');
var expect = chai.expect;
var assert = require('assert');

var redis = require('redis');
var constants = require('../serverconstants');
var codeutil = require('../codeutil');

var client = redis.createClient();

var lib = require('../lib/mud-lib')(client, constants, codeutil);

var testArea = {
    areacode: "KDV",
    name: "Kobold Valley",
    description: "A valley filled with dangerous Kobolds.",
    size: 0
}

var hashKey = codeutil.buildCode(constants.AREAS_KEY, testArea.areacode);

// Tests
describe('The area-lib module', function() {
    describe('Create a new area', function() {
        it('Checks setting of both data pieces', function(done) {
            lib.setArea(testArea.areacode, testArea);

            assert(client.sismember(constants.AREAS_KEY, testArea.areacode, function(err, res) {
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
    });

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