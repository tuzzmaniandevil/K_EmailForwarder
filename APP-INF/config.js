var
        APP_ID = controllerMappings.appName,
        DB_NAME = APP_ID + '_db',
        DB_TITLE = 'Email Forwarding DB';

var RECORD_TYPES = {
    MAPPING: 'MAPPING'
};

var RECORD_NAMES = {
    MAPPING: function (fromAddress) {
        return 'mapping_' + fromAddress;
    }
};