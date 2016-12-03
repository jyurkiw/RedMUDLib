/**
 * Library that deals with characters.
 * 
 * @namespace character
 * @param {object} client The passed client object.
 * @returns An access object.
 */
function CharacterLib(client) {
    if (typeof(client) === 'undefined') throw "Client argument is required";
    var constants = require('../constants');
    var codeutil = require('../util/codeutil');

    /**
     * Get all members of the CHARACTERS set.
     * 
     * @memberof character
     * @returns An array of character names.
     */
    function getCharacters() {
        return new Promise(function(resolve, reject) {
            client.smembersAsync(constants.CHARACTERS_KEY)
                .then(function(characters) {
                    resolve(characters);
                })
                .catch(function(err) {
                    reject(err);
                });
        });
    }

    /**
     *  Get a list of characters owned by a user.
     * 
     * @memberof character
     * @param {string} username The name of the user.
     * @returns An array of characters.
     */
    function getCharactersForUser(username) {
        return new Promise(function(resolve, reject) {
            client.smembersAsync(codeutil.buildUserCharacterCode(username))
                .then(function(characters) {
                    resolve(characters);
                })
                .catch(function(err) {
                    reject(err);
                });
        });
    }

    /**
     * Get character data.
     * 
     * @memberof character
     * @param {string} charactername The name of the character.
     * @returns A character object.
     */
    function getCharacter(charactername) {
        return new Promise(function(resolve, reject) {
            client.hgetallAsync(codeutil.buildCharacterCode(charactername))
                .then(function(character) {
                    resolve(character);
                })
                .catch(function(err) {
                    reject(err);
                });
        });
    }

    /**
     * Create a basic character for a user.
     * Just populates the basic required structures with default data.
     * Doesn't populate anything specific beyond default room. 
     * 
     * @memberof character
     * @param {string} username The user's name.
     * @param {string} charactername The character's name.
     * @param {string} defaultroom The default room.
     * @returns True if the character was added.
     */
    function createCharacter(username, charactername, defaultroom) {
        return new Promise(function(resolve, reject) {
            if (username === undefined || username === null || username === '' ||
                charactername === undefined || charactername === null || charactername === '' ||
                defaultroom === undefined || defaultroom === null || defaultroom === '') {
                resolve(false);
                return;
            }

            var cb = require('../character/character-creator');
            var characterdata = cb.buildDefaultCharacterObject(charactername, username, defaultroom);

            var usercharactercode = codeutil.buildUserCharacterCode(username);
            var charactercode = codeutil.buildCharacterCode(charactername);

            client.multi()
                .sismember(constants.CHARACTERS_KEY, charactername)
                .sismember(usercharactercode, charactername)
                .execAsync()
                .then(function(results) {
                    if (results[0] === 0 && results[1] === 0) {
                        client.multi()
                            .sadd(constants.CHARACTERS_KEY, charactername)
                            .sadd(usercharactercode, charactername)
                            .hmset(charactercode, characterdata)
                            .execAsync()
                            .then(function() {
                                resolve(true);
                            });
                    } else {
                        reject(constants.errors.CHARACTER_ALREADY_EXISTS);
                    }
                });
        });
    }

    /**
     * Update a character's room.
     * 
     * @memberof character
     * @param {string} charactername The name of the character.
     * @param {string} newRoomcode The new room code.
     * @returns A Promise.
     */
    function updateCharacterRoom(charactername, newRoomcode) {
        return new Promise(function(resolve, reject) {
            client.hsetAsync(codeutil.buildCharacterCode(charactername), constants.CHARACTER_ROOM_KEY, newRoomcode)
                .then(function() {
                    resolve(true);
                })
                .catch(function(err) {
                    reject(err);
                });
        });
    }

    return {
        character: {
            async: {
                createCharacter: createCharacter,
                getCharacters: getCharacters,
                getCharactersForUser: getCharactersForUser,
                getCharacter: getCharacter,
                updateCharacterRoom: updateCharacterRoom
            }
        }
    };
}

module.exports = CharacterLib;