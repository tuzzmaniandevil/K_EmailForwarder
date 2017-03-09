(function (g) {
    g._mappings = {};

    g._mappings[g._config.RECORD_TYPES.MAPPING] = {
        "properties": {
            "createdBy": {
                "type": "string",
                "index": "not_analyzed"
            },
            "emailAlias": {
                "type": "string",
                "index": "not_analyzed"
            },
            "emailItems": {
                "type": "long"
            },
            "forwardTo": {
                "type": "string",
                "index": "not_analyzed"
            },
            "websiteName": {
                "type": "string",
                "index": "not_analyzed"
            }
        }
    };

    g._mappings[g._config.RECORD_TYPES.RECEIVED_EMAIL] = {
    };
})(this);