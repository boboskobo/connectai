<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\AppCredential;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index()
    {
        $appCredentials = AppCredential::first();
        return view('welcome', get_defined_vars());
    }

}
