<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rock RMS | Trusted Church Management</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="icon" href="{{ asset('assets/img/Logo.png') }}" type="image/x-icon">
    <link rel="stylesheet" href="{{ asset('assets/css/welcomePage.css') }}">


</head>

<body>

    <!-- Navbar -->
    <nav class="navbar navbar-expand-lg navbar-dark">
        <div class="container">
            <a class="navbar-brand" href="#">
                <img src="{{ asset('assets/img/Logo.png') }}" alt="Logo">
                RMS
            </a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse justify-content-end" id="navbarNav">
                <ul class="navbar-nav">
                
                </ul>
            </div>
        </div>
    </nav>

    <!-- Main Content Section -->
    <div class="bg-overlay">
        <h1 class="display-4 mb-4">Rock RMS</h1>
        <p class="lead mb-4">Trusted by churches and organizations worldwide, Rock RMS is church management centered on relationships.</p>
        <a href="https://marketplace.gohighlevel.com/oauth/chooselocation?response_type=code&redirect_uri={{ env('SITE_BASE_URL') }}/callback&client_id={{ $appCredentials['client_id'] }}&scope=workflows.readonly contacts.readonly contacts.write locations/tags.write"
           class="btn btn-custom">
            Install App Now
        </a>
    </div>

    <!-- Footer -->
    <footer>
        <div class="container">
            <p>&copy; 2024 Rock RMS. All rights reserved.</p>
        </div>
    </footer>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js"></script>
</body>

</html>
