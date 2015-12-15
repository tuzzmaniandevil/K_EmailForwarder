function initEmailForwarder() {
    initDeleteForwarder();
    initCreateModal();
}

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

    modal.on('hidden', function () {
        form.trigger('reset');
        modal.find('.modal-title').html('Hello World');
    });

    form.forms({
        validate: function (form) {
            var target = $("input[type=email]", form);

            flog('target', target);

            target.each(function (i, item) {
                validateEmail(item, form);
            });

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

function validateEmail(elem, form) {
    var emailPattern = new RegExp(/^(("[\w-\s]+")|([\w-'']+(?:\.[\w-]+)*)|("[\w-\s]+")([\w-]+(?:\.[\w-]+)*))(@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)|(@\[?((25[0-5]\.|2[0-4][0-9]\.|1[0-9]{2}\.|[0-9]{1,2}\.))((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){2}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\]?$)/i);

    var a = $(elem);
    var val = a.val();
    if (a.attr('name') === "alias") {

        if (val !== "*") {
            if (!emailPattern.test(val)) {
                showValidation(a, "Please check the format of your email address, it should read like ben@somewhere.com", form);
                return false;
            }
        }
    } else if (a.attr('name') === "forwardTo") {
        if (val.indexOf(',') > 0) {
            var vals = val.split(',');
            for (var x = 0; x < vals.length; x++) {
                var t = vals[x].trim();
                if (t.length < 1 || !emailPattern.test(t)) {
                    showValidation(a, "Please check the format of your email address, it should read like ben@somewhere.com", form);
                    return false;
                }
            }
        } else {
            if (!emailPattern.test(val)) {
                showValidation(a, "Please check the format of your email address, it should read like ben@somewhere.com", form);
                return false;
            }
        }
    }

    return true;
}