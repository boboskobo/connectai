$(document).ready(function() {
    $('#submitCustomerButton').click(function() {
        const formData = {
            rms_apikey: $('#rms_apikey').val(),
            baseUrl: $('#baseUrl').val(),
            location_id: $('#location_id').val(),
            _token: $('meta[name="csrf-token"]').attr('content'),
        };

        $.ajax({
            type: 'POST',
            url: '/custom',
            data: formData,
            dataType: 'json',
            success: function(response) {
                $('#toastMessage').html(response.message);
                $('#customerToast').removeClass(
                    'error');
                var toastElement = new bootstrap.Toast(document.getElementById(
                    'customerToast'));
                toastElement.show();
            },
            error: function(xhr) {
                $('#toastMessage').html('Error: ' + xhr.responseText);
                $('#customerToast').addClass('error');
                var toastElement = new bootstrap.Toast(document.getElementById(
                    'customerToast'));
                toastElement.show();
            }
        });
    });
});

