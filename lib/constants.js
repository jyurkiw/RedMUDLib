module.exports = {
    // Code Constants
    AREAS_KEY: "AREAS",
    ROOMS_KEY: "RM",
    ROOMS_EXIT_KEY: "EX",
    USER_KEY: "USER",
    USERS_KEY: "USERS",
    USER_CHARACTERS_KEY: "CH",
    CHARACTERS_KEY: "CHARACTERS",
    CHARACTER_KEY: "CHAR",

    // Key Constants
    AREA_DATA_CODE_KEY: "areacode",
    AREA_DATA_SIZE_KEY: "size",
    CHARACTER_ROOM_KEY: "room",
    ROOM_DATA_EXITS_KEY: "exits",
    ROOM_DATA_ROOMNUMBER_KEY: "roomnumber",
    ROOM_DATA_NAME_KEY: "name",
    USER_NAME_KEY: "username",
    USER_PASSWORD_HASH_KEY: "pwhash",

    // Message Constants
    AREA_DELETED_MSG: "Area Deleted",

    // Redis Constants
    REDIS_OK: 'OK',

    // Status Codes
    OK: 0,
    AREA_DELETED: 101,

    errors: {
        CREATE_AREACODE_NO_EXIST_IN_PAYLOAD: "The areaData object must have an areacode property, and it must match the areaCode argument.",
        CREATE_AREACODES_NO_MATCH: "The areaData areacode and areaCode argument must match.",
        CREATE_BAD_AREACODE: "The passed areaCode does not exist.",
        UPDATE_AREACODE_NO_EXIST: "The provided areacode does not exist.",

        ADMIN_AREA_NO_ROOMS: "The area had no rooms.",

        USER_PASSWORD_NO_MATCH: "The username or password does not match.",
        USER_ALREADY_EXISTS: "A user by that name already exists.",
        CHARACTER_ALREADY_EXISTS: "A character by that name already exists."
    }
};