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

var username2 = 'testUser2';
var pwhash2 = '23456';

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

        describe('Get character information', function() {
            beforeEach(function() {
                return lib.character.async.createCharacter(username, charactername1, defaultroom);
            });

            it('Get Character List', function() {
                return lib.character.async.getCharacters()
                    .then(function(characters) {
                        should.exist(characters);
                        characters.should.be.an('array');
                        characters.should.have.lengthOf(1);
                        characters[0].should.equal(charactername1);
                    });
            });

            it('Get Character List for Single User', function() {
                return lib.character.async.getCharactersForUser(username)
                    .then(function(characters) {
                        should.exist(characters);
                        characters.should.be.an('array');
                        characters.should.have.lengthOf(1);
                        characters[0].should.equal(charactername1);
                    });
            });

            describe('Multiple users with characters available', function() {
                beforeEach(function() {
                    return lib.user.async.createUser(username2, pwhash2)
                        .then(function() {
                            return lib.character.async.createCharacter(username2, charactername2, defaultroom);
                        });
                });

                it('Get all characters from one user', function() {
                    return lib.character.async.getCharactersForUser(username)
                        .then(function(characters) {
                            should.exist(characters);
                            characters.should.be.an('array');
                            characters.should.have.lengthOf(1);
                            characters[0].should.equal(charactername1);
                        });
                });
            });

            it('Get Character', function() {
                return lib.character.async.getCharacter(charactername1)
                    .then(function(character) {
                        console.log(character);
                        should.exist(character);
                        character.should.be.an('object');
                        should.exist(character.name);
                        character.name.should.equal(charactername1);
                        should.exist(character.owner);
                        character.owner.should.equal(username);
                        should.exist(character.room);
                        character.room.should.equal(defaultroom);
                    });
            });
        });
    });
});