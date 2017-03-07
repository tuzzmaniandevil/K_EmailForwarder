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
     * @returns {Boolean}
     */
    g._verifyMailbox = function (page, to) {
        var db = _getOrCreateUrlDb(page);
        log.info('verifyMailbox db={}, to={}', db, to);

        var toAddress = to.toPlainAddress();

        var mappingName = _config.RECORD_NAMES.MAPPING(to.user, page.website.id);

        var record = db.child(mappingName);

        if (isNull(record)) {
            record = db.child(_config.RECORD_NAMES.MAPPING('*', page.website.id));
        }

        if (isNull(record)) {
            log.info('No record found for this address: {}', toAddress);
            return false;
        }

        return true;
    };

    /**
     *
     * @param {WebsiteRootFolder} page
     * @param {MailboxAddress} to
     * @param {RepoMailboxStandardMessage} msg
     */
    g._storeMail = function (page, to, msg) {
        var db = _getOrCreateUrlDb(page);

        var app = applications.get(_config.APP_ID);
        var userApp = applications.userApp;
        var sendAlias = app.getSetting('sendAlias');

        if (isBlank(sendAlias)) {
            sendAlias = 'forwarder@' + page.domainName;
        }

        var fromAddress = msg.from.toPlainAddress();
        var toAddress = to.toPlainAddress();

        var user = null;

        /* Check for a Catch All mapping */
        var catchAll = db.child(_config.RECORD_NAMES.MAPPING('*', page.website.id));
        if (isNotNull(catchAll)) {
            user = catchAll.get('createdBy');
            var json = JSON.parse(catchAll.json);
            var toAddresses = json.forwardTo;

            for (var i = 0; i < toAddresses.length; i++) {
                var to = toAddresses[i].trim();
                if (isNull(user)) {
                    var p = userApp.findUserResource(to);
                    if (isNotNull(p)) {
                        user = p;
                    }
                }
                var iId = createEmail(sendAlias, fromAddress, to, msg);

                if (json.emails[0] == 0) {
                    json.emails.splice(0, 1);
                }

                json.emails.push(iId);
            }

            if (isNotNull(user)) {
                securityManager.runAsUser(user, function () {
                    catchAll.update(JSON.stringify(json));
                });
            }
        }

        /* Check for an exact mapping */
        var record = db.child(_config.RECORD_NAMES.MAPPING(to.user, page.website.id));

        if (isNull(record)) {
            log.info('No record found for this address: {}', toAddress);
        } else {
            if (isNull(user)) {
                user = record.get('createdBy');
            }
            var json = JSON.parse(record.json);
            var toAddresses = json.forwardTo;

            for (var i = 0; i < toAddresses.length; i++) {
                var to = toAddresses[i].trim();
                if (isNull(user)) {
                    var p = userApp.findUserResource(to);
                    if (isNotNull(p)) {
                        user = p;
                    }
                }
                var itemId = createEmail(sendAlias, fromAddress, to, msg);

                if (isNull(json.emails)) {
                    json.emails = [];
                }

                if (isNotNull(json.emails) && json.emails[0] == 0) {
                    json.emails.splice(0, 1);
                }

                json.emails.push(itemId);
            }

            if (isNotNull(user)) {
                securityManager.runAsUser(user, function () {
                    record.update(JSON.stringify(json));
                });
            }
        }
    };

    /**
     * @param {String} sendAlias
     * @param {String} from
     * @param {String} to
     * @param {RepoMailboxStandardMessage} msg
     */
    function createEmail(sendAlias, from, to, msg) {
        log.info('createEmail - To={}, From={}, Msg={}', to, from, msg);

        var b = applications.email.emailBuilder();

        b
                .recipientAddress(to)
                .fromAddress(sendAlias)
                .replyToAddress(from)
                .text(msg.text)
                .subject(msg.subject)
                .html(msg.html)
                .toList(msg.to)
                .ccList(msg.cc)
                .bccList(msg.bcc);

        var attachments = msg.attachments;
        for (var i = 0; i < attachments.size(); i++) {
            var att = attachments.get(i);
            b.addAttachement(att.name, att.hash, att.contentType, att.disposition);
        }

        var emailItem = b.build();

        log.info('EmailItem: {}, Org: {}, Created Date: {}', emailItem.id, emailItem.originatingOrg.orgId, emailItem.createdDate);

        return emailItem.id;
    }
})(this);