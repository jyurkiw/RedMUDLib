function AreaLib(client, constants, codeutil) {
    if (typeof(client) === 'undefined') throw "Client argument is required";
    if (typeof(constants) === 'undefined') throw "Constants argument is required";
    if (typeof(codeutil) === 'undefined') throw "Codeutil argument is required";

    function setArea(areaCode, areaData) {
        client.hmset(codeutil.buildCode(constants.AREAS_KEY, areaCode), areaData);

        // Add the area to the areas list
        client.sadd(constants.AREAS_KEY, areaCode);
    };

    function getAreas() {

    };

    function getArea() {

    };

    function deleteArea(areaCode) {
        client.srem(constants.AREAS_KEY, areaCode);

        var hashKey = codeutil.buildCode(constants.AREAS_KEY, areaCode);
        client.hkeys(hashKey, function(err, res) {
            var multiCmd = client.multi();
            for (var i = 0; i < res.length; i++) {
                multiCmd.hdel(hashKey, res[i]);
            }
            multiCmd.exec();
        });
    };

    return {
        setArea: setArea,
        getAreas: getAreas,
        getArea: getArea,
        deleteArea: deleteArea
    }
}

module.exports = AreaLib;