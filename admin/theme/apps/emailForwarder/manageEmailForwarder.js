(function ($, w) {
    w.initEmailForwarder = function () {
        initDeleteForwarder();
        initCreateModal();
    };

    function initDeleteForwarder() {
        $('body').on('click', '.btn-remove-forwarder', function (e) {
            e.preventDefault();

            var btn = $(this);
            var name = btn.attr('href');
            var title = btn.data('title');

            if (confirm('Are you sure you want to delete the forwarder for ' + title)) {
                $.ajax({
                    url: window.location.pathname,
                    type: "POST",
                    dataType: 'json',
                    data: {
                        delForwarder: name
                    },
                    success: function (data, textStatus, jqXHR) {
                        if (data.status) {
                            Msg.success(data.messages);
                            $('#tbody-forwarder').reloadFragment();
                        } else {
                            Msg.warning(data.messages);
                        }
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        log.info('TextStatus', textStatus, 'Error Thrown', errorThrown);
                        Msg.warning('An error occurred while trying to delete this forwarder. Please contact your administrator.');
                    }
                });
            }
        });
    }

    function initCreateModal() {
        var modal = $('#modal-add-forwarder');
        var form = modal.find('form');
        var forwardTo = form.find('#forwardTo');

        forwardTo.tagsinput();

        forwardTo.on('beforeItemAdd', function (e) {
            var newItem = safeString(e.item);
            var items = forwardTo.tagsinput('items');
            var isValid = true;

            // Validate the email address
            if (!validateEmail(newItem)) {
                e.cancel = true;
                isValid = false;
                flog('Invalid email address');
            }

            // Check to make sure we don't have any duplicates
            if (isNotNull(items) && isValid) {
                for (var i in items) {
                    var item = safeString(items[i]).toLowerCase();
                    if (newItem === item) {
                        e.cancel = true;
                        break;
                    }
                }
            }
        });

        forwardTo.on('itemAdded', function (e) {
            console.log(e);
        });

        $('body').on('click', '.btn-edit-forwarder', function (e) {
            e.preventDefault();

            var btn = $(this);
            var row = btn.closest('tr');
            var data = row.data('json');
            var name = row.data('name');

            modal.find('.modal-title').html('Edit an Email Forwarder');
            modal.find('.btn-create').html('Save');
            modal.find('.action').attr('name', 'editForwarder');
            modal.find('.action').val(name);

            modal.find('#alias').val(data.emailAlias);
            modal.find('#forwardTo').tagsinput('removeAll');

            if (isNotNull(data.forwardTo)) {
                for (var i in data.forwardTo) {
                    var t = data.forwardTo[i];
                    modal.find('#forwardTo').tagsinput('add', t, {preventPost: true});
                }
            }

            modal.find('#website').val(data.websiteName);

            modal.modal('show');

        });

        modal.on('hidden.bs.modal', function () {
            form.trigger('reset');
            modal.find('.modal-title').html('Add an Email Forwarder');
            modal.find('.btn-create').html('Create');
            modal.find('.action').attr('name', 'createNew');
            modal.find('.action').val('createNew');
            modal.find('#forwardTo').tagsinput('removeAll');
        });

        form.forms({
            validate: function (form) {
                if (!validateAlias($('input[name=alias]', form), form)) {
                    return false;
                }

                return true;
            },
            callback: function (resp) {
                if (resp.status) {
                    Msg.success(resp.messages);
                    modal.modal('hide');
                    $('#tbody-forwarder').reloadFragment();
                } else {
                    Msg.warning(resp.messages);
                }
            }
        });
    }

    function validateAlias(elem, form) {
        var alias = new RegExp(/^(("[\w-\s]+")|([\w-'']+(?:\.[\w-]+)*)|("[\w-\s]+")([\w-]+(?:\.[\w-]+)*))$/i);

        var a = $(elem);
        var val = a.val();
        if (val === '*') {
            return true;
        } else if (!alias.test(val)) {
            showValidation(a, "Please check the format of the alias. e.g. orders or info", form);
            return false;
        }

        return true;
    }

    function validateEmail(val) {
        var emailPattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

        var s = safeString(val);

        return emailPattern.test(s);
    }

    function safeString(val) {
        if (isNull(val) || isBlank(val)) {
            return '';
        }

        return val.toString().trim();
    }

    function isBlank(val) {
        if (isNull(val)) {
            return true;
        }
        var s = val.toString().trim();

        return s.length < 1;
    }

    function isNull(val) {
        return !isNotNull(val);
    }

    function isNotNull(val) {
        return val !== null && typeof val !== 'undefined';
    }

    // Init Methods
    $(function () {
        initDeleteForwarder();
        initCreateModal();
    });
})(jQuery, window);