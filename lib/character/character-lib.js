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
            var characterdata = cb.buildDefaultCharacterObject(charactername, defaultroom);

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

    return {
        character: {
            async: {
                createCharacter: createCharacter
            }
        }
    };
}

module.exports = CharacterLib;