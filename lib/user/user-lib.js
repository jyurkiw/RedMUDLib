/**
 * Library that deals with users.
 * 
 * @namespace user
 * @param {object} client The passed client object.
 * @returns An access object.
 */
function UserLib(client) {
    if (typeof(client) === 'undefined') throw "Client argument is required";
    var constants = require('../constants');
    var codeutil = require('../util/codeutil');

    /**
     * Get a list of users in the system.
     * 
     * @memberof user
     * @returns Users in the USERS set.
     */
    function getUsers() {
        return new Promise(function(resolve, reject) {
            client.smembersAsync(constants.USERS_KEY)
                .then(function(users) {
                    resolve(users);
                })
                .catch(function(err) {
                    reject(err);
                });
        });
    }

    /**
     * Get a user from the db.
     * 
     * @param {any} username The username.
     * @returns The user object.
     */
    function getUser(username) {
        return new Promise(function(resolve, reject) {
            var usercode = codeutil.buildUserCode(username);

            client.hgetallAsync(usercode)
                .then(function(user) {
                    resolve(user);
                })
                .catch(function(err) {
                    reject(err);
                });
        });
    }

    /**
     * Create a user.
     * 
     * @memberof user
     * @param {string} username The user's name.
     * @param {string} pwhash The user's password hash.
     * @returns True if the user was created.
     */
    function createUser(username, pwhash) {
        return new Promise(function(resolve, reject) {
            if (username === null || username === undefined || username === '' ||
                pwhash === null || pwhash === undefined || pwhash === '') {
                resolve(false);
                return;
            }

            client.saddAsync(constants.USERS_KEY, username)
                .then(function(saddCount) {
                    if (saddCount === 1) {
                        client.hmsetAsync(codeutil.buildUserCode(username), constants.USER_NAME_KEY, username, constants.USER_PASSWORD_HASH_KEY, pwhash)
                            .then(function(ok) {
                                resolve(ok === constants.REDIS_OK);
                            });
                    } else {
                        reject(constants.errors.USER_ALREADY_EXISTS);
                    }
                });
        });
    }

    /**
     * Check the passed user's password against the hash stored in the DB.
     * 
     * @memberof user
     * @param {any} username A username.
     * @param {any} pwhash A password hash.
     * @returns True if the password matches the value in the DB.
     */
    function checkPassword(username, pwhash) {
        return new Promise(function(resolve, reject) {
            client.hgetAsync(codeutil.buildUserCode(username), constants.USER_PASSWORD_HASH_KEY)
                .then(function(storedPwHash) {
                    if (pwhash == storedPwHash) {
                        resolve(true);
                    } else {
                        reject(constants.errors.USER_PASSWORD_NO_MATCH);
                    }
                })
                .catch(function(err) {
                    reject(err);
                });
        });
    }

    return {
        user: {
            async: {
                getUsers: getUsers,
                getUser: getUser,
                createUser: createUser,
                checkPassword: checkPassword
            }
        }
    };
}

module.exports = UserLib;