function manageEmailForwarder(page, params) {
    log.info('manageEmailForwarder - Page={}, Params={}', page, params);
    var db = getOrCreateUrlDb(page);

    var mappings = db.findByType(RECORD_TYPES.MAPPING);

    page.attributes.mappings = mappings;
}

function addForwarder(page, params) {
    log.info('addForwarder - Page={}, Params={}', page, params);
    var alias = safeString(params.alias);
    var forwardTo = safeArray(params.forwardTo);

    var mappingName = RECORD_NAMES.MAPPING(alias);

    var db = getOrCreateUrlDb(page);

    var record = db.child(mappingName);

    if (isNotNull(record)) {
        return page.jsonResult(false, 'A forwarder for the alias "' + alias + '"already exists.');
    }

    if (forwardTo.length < 1) {
        return page.jsonResult(false, 'At least one forward email address is required.')
    }

    var d = {
        "emailAlias": alias,
        "forwardTo": []
    };

    for (var i = 0; i < forwardTo.length; i++) {
        d.forwardTo.push(forwardTo[i].trim());
    }

    db.createNew(mappingName, JSON.stringify(d), RECORD_TYPES.MAPPING);

    return page.jsonResult(true, 'Successfully added.');
}

function deleteForwarder(page, params) {
    log.info('deleteForwarder - Page={}, Params={}', page, params);

    var mappingName = safeString(params.delForwarder);

    var db = getOrCreateUrlDb(page);

    var record = db.child(mappingName);

    if (isNull(record)) {
        return page.jsonResult(false, 'a Record for ' + mappingName + ' could not be found.');
    }

    record.delete();

    return page.jsonResult(true, 'Successfully deleted.');
}