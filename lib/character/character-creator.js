/**
 * Character creation utilities.
 * @namespace character-creation
 */
function CharacterCreator() {
    var defaultCharacterObject = {
        name: null,
        room: null
    };

    /**
     * Create a default character object.
     * 
     * @memberof character-creation
     * @param {any} charactername The name of the character.
     * @param {any} defaultroomcode The default room to put the character in.
     * @returns A defaulted character object.
     */
    function BuildDefaultCharacterObject(charactername, defaultroomcode) {
        var co = Object.assign({}, defaultCharacterObject);

        co.name = charactername;
        co.room = defaultroomcode;

        return co;
    }

    return {
        buildDefaultCharacterObject: BuildDefaultCharacterObject
    }
}

module.exports = CharacterCreator();