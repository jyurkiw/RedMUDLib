module.exports = {
    // Code Constants
    AREAS_KEY: "AREAS",
    ROOMS_KEY: "RM",
    ROOMS_EXIT_KEY: "EX",

    // Key Constants
    AREA_DATA_SIZE_KEY: "size",
    ROOM_DATA_EXITS_KEY: "exits",

    // Message Constants
    AREA_DELETED_MSG: "Area Deleted",

    // Status Codes
    OK: 0,
    AREA_DELETED: 101,

    errors: {
        CREATE_AREACODE_NO_EXIST_IN_PAYLOAD: "The areaData object must have an areacode property, and it must match the areaCode argument.",
        CREATE_AREACODES_NO_MATCH: "The areaData areacode and areaCode argument must match",
        UPDATE_AREACODE_NO_EXIST: "The provided areacode does not exist."
    }
};