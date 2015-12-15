/*==== Mailbox Controller ====*/
controllerMappings
        .mailboxController()            // Get a builder instance
        .enabled(true)                  // Set this mailbox as enabled
        .verifyMailbox('verifyMailbox') // Set the function to check if this app wants to handle the incoming email
        .storeMail('storeMail')         // Set the function to handle incoming emails
        .build();                       // Build the controller

/*==== Admin Page Controllers ====*/
controllerMappings
        .adminController()
        .enabled(true)
        .path('/emailForwarder/')
        .defaultView(views.templateView('/theme/apps/emailForwarder/managerEmailForwarder.html'))
        .addMethod('GET', 'manageEmailForwarder')
        .addMethod('POST', 'addForwarder', 'createNew')
        .addMethod('POST', 'editForwarder', 'editForwarder')
        .addMethod('POST', 'deleteForwarder', 'delForwarder')
        .build();

controllerMappings
        .adminController()
        .enabled(true)
        .path('/emailForwarder')
        .defaultView(views.redirectView('/emailForwarder/'))
        .build();