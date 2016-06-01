(function (g) {
    /*==== Admin Page Controllers ====*/
    controllerMappings
            .adminController()
            .enabled(true)
            .path('/emailForwarder/')
            .defaultView(views.templateView('/theme/apps/emailForwarder/managerEmailForwarder.html'))
            .addMethod('GET', '_manageEmailForwarder')
            .addMethod('POST', '_addForwarder', 'createNew')
            .addMethod('POST', '_editForwarder', 'editForwarder')
            .addMethod('POST', '_deleteForwarder', 'delForwarder')
            .build();

    /**
     * 
     * @param {ControllerResource} page
     * @param {Map} params
     */
    function manageEmailForwarder(page, params) {
        log.info('manageEmailForwarder - Page={}, Params={}', page, params);
        var db = _getOrCreateUrlDb(page);

        var mappings = db.findByType(_config.RECORD_TYPES.MAPPING);

        page.attributes.mappings = mappings;
    }

    /**
     * 
     * @param {ControllerResource} page
     * @param {Map} params
     * @returns {JsonResult}
     */
    function addForwarder(page, params) {
        log.info('addForwarder - Page={}, Params={}', page, params);
        var alias = safeString(params.alias);
        var websiteId = safeInt(params.website);
        var forwardTo = safeArray(params.forwardTo);

        var mappingName = _config.RECORD_NAMES.MAPPING(alias, websiteId);

        var db = _getOrCreateUrlDb(page);

        var record = db.child(mappingName);

        if (isNotNull(record)) {
            return page.jsonResult(false, 'A forwarder for the alias "' + alias + '"already exists.');
        }

        if (forwardTo.length < 1) {
            return page.jsonResult(false, 'At least one forward email address is required.')
        }

        var createdBy = null;
        var curUser = securityManager.currentUser;
        if (isNotNull(curUser)) {
            createdBy = curUser.name;
        }

        var d = {
            "emailAlias": alias,
            "forwardTo": [],
            "websiteId": websiteId,
            "emails": [],
            "createdBy": createdBy
        };

        for (var i = 0; i < forwardTo.length; i++) {
            d.forwardTo.push(forwardTo[i].trim());
        }

        db.createNew(mappingName, JSON.stringify(d), _config.RECORD_TYPES.MAPPING);

        return page.jsonResult(true, 'Successfully added.');
    }

    /**
     * 
     * @param {ControllerResource} page
     * @param {Map} params
     * @returns {JsonResult}
     */
    function editForwarder(page, params) {
        log.info('editForwarder - Page={}, Params={}', page, params);

        var mappingName = safeString(params.editForwarder);
        var alias = safeString(params.alias);
        var websiteId = safeInt(params.website);
        var forwardTo = safeArray(params.forwardTo);

        var db = _getOrCreateUrlDb(page);

        var record = db.child(mappingName);

        if (isNull(record)) {
            return page.jsonResult(false, 'a Record for ' + mappingName + ' could not be found.');
        }

        var createdBy = null;
        var curUser = securityManager.currentUser;
        if (isNotNull(curUser)) {
            createdBy = curUser.name;
        }

        var d = {
            "emailAlias": alias,
            "forwardTo": [],
            "websiteId": websiteId,
            "createdBy": createdBy
        };

        for (var i = 0; i < forwardTo.length; i++) {
            d.forwardTo.push(forwardTo[i].trim());
        }

        var newName = _config.RECORD_NAMES.MAPPING(alias, websiteId);
        if (mappingName === newName) {
            record.update(JSON.stringify(d));
            return page.jsonResult(true, 'Successfully updated.');
        } else {
            record.delete();

            db.createNew(newName, JSON.stringify(d), _config.RECORD_TYPES.MAPPING);
            return page.jsonResult(true, 'Successfully updated.');
        }
    }

    /**
     * 
     * @param {ControllerResource} page
     * @param {Map} params
     * @returns {JsonResult}
     */
    function deleteForwarder(page, params) {
        log.info('deleteForwarder - Page={}, Params={}', page, params);

        var mappingName = safeString(params.delForwarder);

        var db = _getOrCreateUrlDb(page);

        var record = db.child(mappingName);

        if (isNull(record)) {
            return page.jsonResult(false, 'a Record for ' + mappingName + ' could not be found.');
        }

        record.delete();

        return page.jsonResult(true, 'Successfully deleted.');
    }

    g._manageEmailForwarder = manageEmailForwarder;
    g._addForwarder = addForwarder;
    g._editForwarder = editForwarder;
    g._deleteForwarder = deleteForwarder;
})(this);