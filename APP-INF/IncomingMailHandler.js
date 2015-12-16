(function (g) {
    /*==== Mailbox Controller ====*/
    controllerMappings
            .mailboxController()             // Get a builder instance
            .enabled(true)                   // Set this mailbox as enabled
            .verifyMailbox('_verifyMailbox') // Set the function to check if this app wants to handle the incoming email
            .storeMail('_storeMail')         // Set the function to handle incoming emails
            .build();                        // Build the controller

    /**
     * 
     * @param {WebsiteRootFolder} page
     * @param {MailboxAddress} to
     * @param {RepoMailboxStandardMessage} msg
     */
    g._storeMail = function (page, to, msg) {
        var db = getOrCreateUrlDb(page);

        var fromAddress = msg.from.toPlainAddress();
        var toAddress = to.toPlainAddress();

        /* Check for a Catch All mapping */
        var catchAll = db.child(RECORD_NAMES.MAPPING('*', page.website.id));
        if (isNotNull(catchAll)) {
            var json = JSON.parse(catchAll.json);
            var toAddresses = json.forwardTo;

            for (var i = 0; i < toAddresses.length; i++) {
                var to = toAddresses[i];
                createEmail(fromAddress, to, msg);
            }
        }

        /* Check for an exact mapping */
        var record = db.child(RECORD_NAMES.MAPPING(to.user, page.website.id));

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
    };

    /**
     * 
     * @param {WebsiteRootFolder} page
     * @param {MailboxAddress} to
     * @returns {Boolean}
     */
    g._verifyMailbox = function (page, to) {

        var db = getOrCreateUrlDb(page);

        var toAddress = to.toPlainAddress();

        var mappingName = RECORD_NAMES.MAPPING(to.user, page.website.id);

        var record = db.child(mappingName);

        if (isNull(record)) {
            record = db.child(RECORD_NAMES.MAPPING('*', page.website.id));
        }

        if (isNull(record)) {
            log.info('No record found for this address: {}', toAddress);
            return false;
        }

        return true;
    };

    /**
     * 
     * @param {String} from
     * @param {String} to
     * @param {RepoMailboxStandardMessage} msg
     */
    function createEmail(from, to, msg) {
        log.info('createEmail - To={}, From={}, Msg={}', to, from, msg);

        var b = applications.email.emailBuilder();

        b
                .recipientAddress(to)
                .fromAddress(from)
                .replyToAddress(from)
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
})(this);