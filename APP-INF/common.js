/* global _config, applications, views, transactionManager */

(function (g) {
    g._getOrCreateUrlDb = function (page) {
        var jsonDb = page.find('/jsondb');
        var db = jsonDb.child(_config.DB_NAME);
        log.info("jsonDb = {} db = {}", jsonDb, db);
        if (isNull(db)) {
            db = jsonDb.createDb(_config.DB_NAME, _config.DB_TITLE, _config.DB_NAME);

            _setAllowAccess(db, true);
        }

        return db;
    }

    g._setAllowAccess = function (jsonDB, allowAccess) {
        transactionManager.runInTransaction(function () {
            jsonDB.setAllowAccess(allowAccess);
        });
    };

    g._checkRedirect = function (page, params) {
        var href = page.href;
        if (!href.endsWith('/')) {
            return views.redirectView(href + '/');
        }
    };

    g.getAppSettings = function (page) {
        var websiteFolder = page.closest('websiteVersion');
        var org = page.organisation;
        var branch = null;

        if (websiteFolder !== null && typeof websiteFolder !== 'undefined') {
            branch = websiteFolder.branch;
        }

        var app = applications.get(_config.APP_ID);
        if (app !== null) {
            var settings = app.getAppSettings(org, branch);
            return settings;
        }
        return null;
    };
})(this);

var getWebsite = function (page, websiteName) {
    return page.find('/websites/' + websiteName);
};