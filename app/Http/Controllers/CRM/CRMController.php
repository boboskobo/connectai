<?php

namespace App\Http\Controllers\CRM;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class CRMController extends Controller
{

    public function index(Request $request)
    {
        $response = ghl_token($request);
        $this->save($response);
        return redirect()->route('dashboard');
    }

    protected function save($tokensData)
    {
        $setting = Setting::where('location_id', $tokensData->locationId)->first();

        if (!$setting) {
            $setting = new Setting();
        }

        $setting->location_id = $tokensData->locationId;
        $setting->company_id = $tokensData->companyId;
        $setting->ghl_user_id = $tokensData->userId;
        $setting->user_type = $tokensData->userType;
        $setting->access_token = $tokensData->access_token;
        $setting->refresh_token = $tokensData->refresh_token;
        $setting->save();
    }
}
