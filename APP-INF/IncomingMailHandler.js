function storeMail(page, to, msg) {
    log.info('Page={}, To={}, From={}, Msg={}', page, to, msg.from, msg);

    var db = getOrCreateUrlDb(page);

    var fromAddress = msg.from.toPlainAddress();
    var toAddress = to.toPlainAddress();

    var record = db.child(RECORD_NAMES.MAPPING(replaceYuckyChars(toAddress)));

    if (isNull(record)) {
        log.info('No record found for this address: {}', toAddress);
        return;
    }

    var json = JSON.parse(record.json);
    var toAddresses = json.forwardTo;

    for (var i = 0; i < toAddresses.length; i++) {
        var to = toAddresses[i];
        createEmail(fromAddress, to, msg);
    }
}

function createEmail(from, to, msg) {
    log.info('createEmail - To={}, Msg={}', to, msg);

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

    b.build();
}