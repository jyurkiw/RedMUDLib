var chai = require('chai');
var expect = chai.expect;
var should = chai.should();
var assert = require('assert');

var constants = require('../lib/constants');
var codeutil = require('../lib/util/codeutil');

var lib = require('../mud-lib')();
var client = lib.client.instance();

var username = 'testUser1';
var pwhash = '12345';

var charactername1 = 'Alder';
var charactername2 = 'Tenmir';
var defaultroom = 'RM:KDV:1';

describe('Character functionality APIs', function() {
    describe('Define character for user', function() {
        beforeEach(function() {
            return client.flushallAsync()
                .then(lib.user.async.createUser(username, pwhash));
        });

        it('Create character', function() {
            return lib.character.async.createCharacter(username, charactername1, defaultroom)
                .then(function(success) {
                    expect(success).to.equal(true);
                });
        });

        it('Create two characters', function() {
            return lib.character.async.createCharacter(username, charactername1, defaultroom)
                .then(function(success) {
                    expect(success).to.equal(true);
                })
                .then(function() {
                    lib.character.async.createCharacter(username, charactername2, defaultroom)
                        .then(function(success) {
                            expect(success).to.equal(true);
                        });
                });
        });

        it('Create duplicate character', function() {
            return lib.character.async.createCharacter(username, charactername1, defaultroom)
                .then(function(success) {
                    expect(success).to.equal(true);
                })
                .then(lib.character.async.createCharacter(username, charactername1, defaultroom))
                .catch(function(err) {
                    expect(err).to.equal(constants.errors.CHARACTER_ALREADY_EXISTS);
                });
        });
    });
});