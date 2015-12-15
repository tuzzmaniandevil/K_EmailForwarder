function storeMail(page, to, msg) {
    var db = getOrCreateUrlDb(page);

    var fromAddress = msg.from.toPlainAddress();
    var toAddress = to.toPlainAddress();

    /* Check for a Catch All mapping */
    var catchAll = db.child(RECORD_NAMES.MAPPING('*'));
    if (isNotNull(catchAll)) {
        var json = JSON.parse(catchAll.json);
        var toAddresses = json.forwardTo;

        for (var i = 0; i < toAddresses.length; i++) {
            var to = toAddresses[i];
            createEmail(fromAddress, to, msg);
        }
    }

    /* Check for an exact mapping */
    var record = db.child(RECORD_NAMES.MAPPING(toAddress));

    if (isNull(record)) {
        log.info('No record found for this address: {}', toAddress);
    } else {

        var json = JSON.parse(record.json);
        var toAddresses = json.forwardTo;

        for (var i = 0; i < toAddresses.length; i++) {
            var to = toAddresses[i];
            createEmail(fromAddress, to, msg);
        }
    }
}

function verifyMailbox(page, to) {

    var db = getOrCreateUrlDb(page);

    var toAddress = to.toPlainAddress();

    var record = db.child(RECORD_NAMES.MAPPING(toAddress));

    if (isNull(record)) {
        record = db.child(RECORD_NAMES.MAPPING('*'));
    }

    if (isNull(record)) {
        log.info('No record found for this address: {}', toAddress);
        return false;
    }

    return true;
}

function createEmail(from, to, msg) {
    log.info('createEmail - To={}, From={}, Msg={}', to, from, msg);

    var b = applications.email.emailBuilder();

    b
            .recipientAddress(to)
            .fromAddress(from)
            .text(msg.text)
            .subject(msg.subject)
            .html(msg.html);

    var attachments = msg.attachments;
    for (var i = 0; i < attachments.size(); i++) {
        var att = attachments.get(i);
        b.addAttachement(att.name, att.hash, att.contentType, att.disposition);
    }

    var emailItem = b.build();

    log.info('EmailItem: {}, Org: {}, Created Date: {}', emailItem.id, emailItem.originatingOrg.orgId, emailItem.createdDate);
}