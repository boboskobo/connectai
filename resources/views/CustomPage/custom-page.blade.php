<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rock RMS | Trusted Church Management</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <link rel="stylesheet" href="{{ asset('assets/css/custom-page.css') }}">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <link rel="icon" href="{{ asset('assets/img/logo.png') }}" type="image/png">

</head>

<body>

    <div class="container mt-3">
        <div class="row">
            <!-- Customer Form -->
            <div class="col-md-6">
                <h3>Rock RMS API KEYS</h3>
                <form id="customerForm" class="form-container">

                    <div class="mb-3">
                        <label for="apikey" class="form-label">API KEYS</label>
                        <div class="input-group">
                            <span class="input-group-text"><i class="fas fa-building"></i></span>
                            <input type="text" class="form-control" id="rms_apikey" name="rms_apikey"
                                placeholder="Enter your API KEY" required>
                            <div class="invalid-feedback">Please enter a valid API KEY.</div>
                        </div>
                    </div>
                     <div class="mb-3">
                        <label for="baseUrl" class="form-label">Church URL</label>
                        <div class="input-group">
                            <span class="input-group-text"><i class="fas fa-globe"></i></span>
                            <input type="text" class="form-control" id="baseUrl" name="baseUrl"
                                placeholder="Enter your API Base URL" required>
                            <div class="invalid-feedback">Please enter a valid URL.</div>
                        </div>
                        <small class="form-text text-muted"><b>Note: The base URL should not end with a trailing slash</b>
                            (<code>/</code>).</small>
                    </div>

                    <input type="hidden" id="location_id" value="">

                    <button type="button" class="btn btn-primary" id="submitCustomerButton">Submit Credentials</button>
                </form>
                <div id="customerResponseMessage" class="mt-3"></div>
            </div>
        </div>

        <!-- Toast -->
        <div id="toastContainer" aria-live="polite" aria-atomic="true"
            style="position: fixed; top: 20px; right: 20px; z-index: 1050;">
            <div id="customerToast" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header">
                    <strong class="me-auto">Message</strong>
                    <button type="button" class="btn-close" id="disconnect_eway" data-bs-dismiss="toast"
                        aria-label="Close"></button>
                </div>
                <div class="toast-body" id="toastMessage"></div>
            </div>
        </div>
    </div>


    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha3/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.0.0/crypto-js.js"></script>
    <script>
        window.parent.postMessage({
            message: "REQUEST_USER_DATA"
        }, "*");

        window.addEventListener("message", function(event) {
            const messageData = event.data;

            if (messageData.message === "REQUEST_USER_DATA_RESPONSE") {
                const sessionKey = messageData.payload;

                const kk = 'bb1a32e8-4912-4650-b609-2bcc6a82715c';

                const decryptedData = CryptoJS.AES.decrypt(sessionKey, kk).toString(CryptoJS.enc.Utf8);
                const parsedData = JSON.parse(decryptedData);

                const locaitonid = parsedData.activeLocation;
                $('#location_id').val(locaitonid);

            }
        });
    </script>
    <script src="{{ asset('assets/js/custom-page.js') }}"></script>

</body>

</html>
