/* global controllerMappings, views */

(function (g) {

    function config() {
        var _self = this;

        _self.APP_ID = controllerMappings.appName;
        _self.DB_NAME = _self.APP_ID + '_db';
        _self.DB_TITLE = 'Email Forwarding DB';

        _self.RECORD_NAMES = {
            MAPPING: function (to, websiteName) {
                return 'mapping_' + to + '_' + websiteName;
            },
            RECEIVED_EMAIL: function (to, websiteName) {
                return 'received_email_' + to + '_' + websiteName;
            }
        };

        _self.RECORD_TYPES = {
            MAPPING: 'MAPPING',
            RECEIVED_EMAIL: 'RECEIVED_EMAIL'
        };
    }

    g._config = new config();

    g._saveSettings = function (page, params) {
        var sendAlias = safeString(params.sendAlias);

        page.setAppSetting(g._config.APP_ID, "sendAlias", sendAlias);

        return views.jsonResult(true);
    };
})(this);