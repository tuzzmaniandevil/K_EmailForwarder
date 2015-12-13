controllerMappings
        .mailboxController()
        .enabled(true)
        .verifyMailbox('verifyMailbox')
        .storeMail('storeMail')
        .build();