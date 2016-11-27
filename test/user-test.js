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

describe('User Admin functionality APIs', function() {
    describe('Create new user', function() {
        beforeEach(function() {
            return client.flushallAsync();
        });

        afterEach(function() {
            return client.flushallAsync();
        });

        it('Create testUser1', function() {
            return lib.user.async.createUser(username, pwhash)
                .then(function(success) {
                    expect(success).to.equal(true);

                    return client.smembersAsync("USERS")
                        .then(function(users) {
                            expect(users.length).to.equal(1);
                            expect(users[0]).to.equal(username);
                        })
                        .then(function() {
                            return client.hgetallAsync("USER:" + username)
                                .then(function(user) {
                                    expect(user.username).to.equal(username);
                                    expect(user.pwhash).to.equal(pwhash);
                                });
                        });
                });
        });

        it('Fail to create user with no password', function() {
            return lib.user.async.createUser(username, null)
                .then(function(success) {
                    expect(success).to.equal(false);
                });
        });

        it('Fail to create user with empty password', function() {
            return lib.user.async.createUser(username, '')
                .then(function(success) {
                    expect(success).to.equal(false);
                });
        });

        it('Fail to create user with no username', function() {
            return lib.user.async.createUser(null, pwhash)
                .then(function(success) {
                    expect(success).to.equal(false);
                });
        });

        it('Fail to create user with empty username', function() {
            return lib.user.async.createUser('', pwhash)
                .then(function(success) {
                    expect(success).to.equal(false);
                });
        });

        it('Fail to create duplicate user', function() {
            return lib.user.async.createUser(username, pwhash)
                .then(function(success) {
                    expect(success).to.equal(true);
                    return lib.user.async.createUser(username, 'password');
                }).catch(function(err) {
                    expect(err).to.equal(constants.errors.USER_ALREADY_EXISTS);
                    return client.hgetAsync('USER:' + username, 'pwhash')
                        .then(function(pw) {
                            expect(pw).to.equal(pwhash);
                        });
                });
        });
    });

    describe('Check user password', function() {
        beforeEach(function() {
            return client.flushallAsync()
                .then(function() {
                    client.hmset(constants.USER_KEY + ':' + username, constants.USER_PASSWORD_HASH_KEY, pwhash);
                });
        });

        afterEach(function() {
            return client.flushallAsync();
        });

        it('Check PW Hash for testUser1', function() {
            return lib.user.async.checkPassword(username, pwhash)
                .then(function(success) {
                    expect(success).to.equal(true);
                });
        });

        it('Check Incorrect PW Hash for failure', function() {
            return lib.user.async.checkPassword(username, '23456')
                .catch(function(err) {
                    expect(err).to.equal(constants.errors.USER_PASSWORD_NO_MATCH);
                });
        });
    });
});