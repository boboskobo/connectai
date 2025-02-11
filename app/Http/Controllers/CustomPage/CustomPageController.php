<?php

namespace App\Http\Controllers\CustomPage;

use App\Http\Controllers\Controller;
use App\Models\Credential;
use Illuminate\Http\Request;

class CustomPageController extends Controller
{
    public function index()
    {
        return view('CustomPage.custom-page');
    }

    public function save(Request $request)
    {
        $validatedData = $request->validate([
            'rms_apikey' => 'required',
            'baseUrl' => 'required',
            'location_id' => 'required'
        ]);

        try {
            $credential = Credential::firstOrNew(['location_id' => $validatedData['location_id']]);
            $credential->apikey = $validatedData['rms_apikey'];
            $credential->baseUrl = $validatedData['baseUrl'];
            $credential->save();

            return response()->json([
                'status' => 'success',
                'message' => 'Credentials saved successfully!',
            ], 200);
        } catch (\Throwable $th) {
            return response()->json([
                'status' => 'failed',
                'message' => $th->getMessage(),
            ], 500);
        }
    }
}
