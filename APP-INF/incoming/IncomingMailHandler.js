/* global log, controllerMappings, applications, securityManager, fileManager */

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

        var mappingName = g._config.RECORD_NAMES.MAPPING(to.user, page.website.name);

        var record = db.child(mappingName);

        if (isNull(record)) {
            record = db.child(g._config.RECORD_NAMES.MAPPING('*', page.website.name));
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
     * @param {MailboxAddress} toAddr
     * @param {RepoMailboxStandardMessage} msg
     */
    g._storeMail = function (page, toAddr, msg) {
        var db = _getOrCreateUrlDb(page);

        var app = applications.get(g._config.APP_ID);
        var userApp = applications.userApp;
        var sendAlias = app.getSetting('sendAlias');

        if (isBlank(sendAlias)) {
            sendAlias = 'forwarder@' + page.domainName;
        }

        var fromAddress = msg.from.toPlainAddress();
        var toAddress = toAddr.toPlainAddress();

        var user = null;

        /* Check for a Catch All mapping */
        var catchAll = db.child(g._config.RECORD_NAMES.MAPPING('*', page.website.name));
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
                var iId = createEmailItem(sendAlias, fromAddress, to, msg);

                if (isNull(json.emailItems)) {
                    json.emailItems = [];
                }

                if (json.emailItems[0] === 0) {
                    json.emailItems.splice(0, 1);
                }

                json.emailItems.push(iId);
            }

            if (isNotNull(user)) {
                securityManager.runAsUser(user, function () {
                    catchAll.update(JSON.stringify(json));
                });
            }
        }

        /* Check for an exact mapping */
        var record = db.child(g._config.RECORD_NAMES.MAPPING(toAddr.user, page.website.name));

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
                var itemId = createEmailItem(sendAlias, fromAddress, to, msg);

                if (isNull(json.emailItems)) {
                    json.emailItems = [];
                }

                if (isNotNull(json.emailItems) && json.emailItems[0] === 0) {
                    json.emailItems.splice(0, 1);
                }

                json.emailItems.push(itemId);
            }

            if (isNotNull(user)) {
                securityManager.runAsUser(user, function () {
                    record.update(JSON.stringify(json));
                });
            }
        }

        // Try store incoming email 
        if (isNotNull(user)) {
            // Store incoming email
            securityManager.runAsUser(user, function () {
                var incomingEmail = generateIncomingEmail(toAddr, msg);
                db.createNew(g._config.RECORD_NAMES.RECEIVED_EMAIL(toAddress, page.website.name), JSON.stringify(incomingEmail), g._config.RECORD_TYPES.RECEIVED_EMAIL);
            });
        }
    };

    /**
     * @param {String} sendAlias
     * @param {String} from
     * @param {String} to
     * @param {RepoMailboxStandardMessage} msg
     */
    function createEmailItem(sendAlias, from, to, msg) {
        log.info('createEmailItem - To={}, From={}, Msg={}', to, from, msg);

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

    function generateIncomingEmail(toAddr, msg) {
        var email = {};

        email.from = parseAddress(msg.from);
        email.to = parseAddress(toAddr);
        email.toList = parseAddressList(msg.to);
        email.ccList = parseAddressList(msg.cc);
        email.bccList = parseAddressList(msg.bcc);
        email.replyTo = parseAddress(msg.replyTo);
        email.attachments = parseAttachmentList(msg.attachments);

        email.subject = msg.subject;
        email.html = msg.html;
        email.text = msg.text;
        email.disposition = msg.disposition;
        email.encoding = msg.encoding;
        email.contentLanguage = msg.contentLanguage;
        email.size = safeInt(msg.size);

        email.headers = msg.headers;
    }

    function parseAddressList(list) {
        var emails = [];

        if (isNotNull(list)) {
            for (var i = 0; i < list.size(); i++) {
                var addr = list.get(i);
                var addrS = safeString(addr);
                if (isNotBlank(addrS)) {
                    emails.push(addrS);
                }
            }
        }

        return emails;
    }

    function parseAddress(addr) {
        var addrS = safeString(addr);
        if (isNotBlank(addrS)) {
            return addrS;
        } else {
            return null;
        }
    }

    function parseAttachmentList(list) {
        var attachments = [];

        if (isNotNull(list)) {
            for (var i = 0; i < list.size(); i++) {
                var att = list.get(i);
                if (isNotNull(att)) {
                    var a = {
                        name: att.name,
                        contentId: att.contentId,
                        contentType: att.contentType,
                        disposition: att.disposition
                    };

                    var hash = fileManager.upload(att.inputStream);

                    a.hash = hash;

                    attachments.push(a);
                }
            }
        }

        return attachments;
    }
})(this);