function getOrCreateUrlDb(page) {
    var jsonDb = page.find('/jsondb');
    var db = jsonDb.child(DB_NAME);
    log.info("jsonDb = {} db = {}", jsonDb, db);
    if (isNull(db)) {
        db = jsonDb.createDb(DB_NAME, DB_TITLE, DB_NAME);

        setAllowAccess(db, true);
    }

    return db;
}

var setAllowAccess = function (jsonDB, allowAccess) {
    transactionManager.runInTransaction(function () {
        jsonDB.setAllowAccess(allowAccess);
    });
};

var getAppSettings = function (page) {
    var websiteFolder = page.closest('websiteVersion');
    var org = page.organisation;
    var branch = null;

    if (websiteFolder !== null && typeof websiteFolder !== 'undefined') {
        branch = websiteFolder.branch;
    }

    var app = applications.get(APP_ID);
    if (app !== null) {
        var settings = app.getAppSettings(org, branch);
        return settings;
    }
    return null;
};

var checkRedirect = function (page, params) {
    var href = page.href;
    if (!href.endsWith('/')) {
        return views.redirectView(href + '/');
    }
};

var getWebsiteById = function (page, id) {
    var manageWebsites = page.find('/websites/');
    var websites = manageWebsites.websiteFolders;
    log.info("getWebsiteById id={} websites={} {}", id, websites, websites.size());
    for (var i = 0; i < websites.size(); i++) {
        var w = websites.get(i);
        log.info("website {}", w.website.id);
        if (w !== null && w.website.id === id) {
            return w;
        }
    }

    return null;
};