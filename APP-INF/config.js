(function (g) {

    function config() {
        var _self = this;

        _self.APP_ID = controllerMappings.appName;
        _self.DB_NAME = _self.APP_ID + '_db';
        _self.DB_TITLE = 'Email Forwarding DB'

        _self.RECORD_NAMES = {
            MAPPING: function (to, websiteId) {
                return 'mapping_' + to + '_' + websiteId;
            }
        };

        _self.RECORD_TYPES = {
            MAPPING: 'MAPPING'
        };
    }

    g._config = new config();
})(this);