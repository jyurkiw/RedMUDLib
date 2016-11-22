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
        return lib.admin.user.async.checkPassword(username, pwhash)
        .then(function(success) {
            expect(success).to.equal(true);
        });
    });
});