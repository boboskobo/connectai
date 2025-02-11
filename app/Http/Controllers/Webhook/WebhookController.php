<?php

namespace App\Http\Controllers\Webhook;

use App\Http\Controllers\Controller;
use App\Models\AppInstall;
use Exception;
use Illuminate\Http\Request;


class WebhookController extends Controller
{
    // Webhook
    public function webhook(Request $request)
    {

        try {
            $type = $request->input('type');
            $obj = new AppInstall();

            if ($type === 'INSTALL') {
                $obj->type = $request->input('type');
                $obj->app_id = $request->input('appId');
                $obj->install_type = $request->input('installType');
                $obj->location_id = $request->input('locationId');
                $obj->company_id = $request->input('companyId');
                $obj->save();
            } elseif ($type === 'UNINSTALL') {
                $obj->type = $request->input('type');
                $obj->app_id = $request->input('appId');
                $obj->location_id = $request->input('locationId');
                $obj->save();
            } else {
                return response()->json(['status' => 'success']);
            }
        } catch (Exception $e) {
            save_logs('webhook', $e->getMessage(), 'AppInstallWebhook');
        }
    }
    // Add A New People In Rock RMS
    public function addPeople(Request $request)
    {
        $validated = $request->validate([
            'extras.locationId' => 'required',
        ]);

        $locationId = $request['extras']['locationId'];
        $countryCode = null;
        if (preg_match('/^\+(\d+)/', $request['data']['Phone'], $matches)) {
            $countryCode = $matches[1];
        } else {
            $countryCode = null;
        }
        
        $ageValue=$request['data']['AgeBracket'] ?? 'Unknown';
        $marital=$request['data']['MaritalStatusValueId'] ?? 'Single';  

        
         $ageBrackets = [
        "0-5" => "ZeroToFive",
        "6-12" => "SixToTwelve",
        "13-17" => "ThirteenToSeventeen",
        "18-24" => "EighteenToTwentyFour",
        "25-34" => "TwentyFiveToThirtyFour",
        "35-44" => "ThirtyFiveToFortyFour",
        "45-54" => "FortyFiveToFiftyFour",
        "55-64" => "FiftyFiveToSixtyFour",
        "65-older" => "SixtyFiveOrOlder",
        "Unknown" => "Unknown"
        ];
        
         $maritalStatus = [
        "Single" => "144",
        "Married" => "143",
        "Divorced" => "676",
        ];
        
        $data = [
            "FirstName" => $request['data']['Name'],
            "Email" => $request['data']['Email'],
            "Gender" => $request['data']['Gender'],
            "ConnectionStatusValueId" => $request['data']['ConnectionStatusValueId'],
            "MaritalStatusValueId" =>$maritalStatus[$marital] ?? '144',
            "PrimaryCampusId" => $request['data']['PrimaryCampusId'],
            "ConnectionStatusValueId" => $request['data']['ConnectionStatusValueId'],
            "AgeBracket" => $ageBrackets[$ageValue] ?? 'Unknown',
            "PhoneNumbers" => [
                [
                    "FullNumber" => $request['data']['Phone'],
                    "Number" => preg_replace('/^\+?[0-9]{1,3}/', '', $request['data']['Phone']),
                    "CountryCode" => $countryCode,
                    "IsSystem" => false,
                    "NumberTypeValueId" => 1,
                    "IsMessagingEnabled" => true
                ]
            ],
        ];
    
      
        
        $credentials = getCredentials($locationId);
        $apikey = $credentials->apikey;
        $baseUrl = $credentials->baseUrl;
        if (empty($apikey) || empty($baseUrl)) {
            return response()->json([
                'status' => 402,
                'message' => 'Please provide the API key & Base URL',
            ]);
        }
        $response = rockApiCall($baseUrl, '/api/People', $apikey, 'POST', $data, []);
        save_logs('addPeople',json_encode($response),'112');

        if ($response && is_numeric($response)) {
            return response()->json([
                'status' => 'success',
                'Id' => $response,
            ], 200);
        }

        return response()->json([
            'status' => 'failed',
            'message' => 'Failed to create person.',
        ], 400);
    }
    // Update An Person
    public function updatePeople(Request $request)
    {

        $validated = $request->validate([
            'data.PeopleID' => 'required',
            'extras.locationId' => 'required',
        ]);
        $countryCode = null;
        if (preg_match('/^\+(\d+)/', $request['data']['Phone'], $matches)) {
            $countryCode = $matches[1];
        } else {
            $countryCode = null;
        }
         $ageValue=$request['data']['AgeBracket'] ?? 'Unknown';
        $marital=$request['data']['MaritalStatusValueId'] ?? 'Single';  

        
         $ageBrackets = [
        "0-5" => "ZeroToFive",
        "6-12" => "SixToTwelve",
        "13-17" => "ThirteenToSeventeen",
        "18-24" => "EighteenToTwentyFour",
        "25-34" => "TwentyFiveToThirtyFour",
        "35-44" => "ThirtyFiveToFortyFour",
        "45-54" => "FortyFiveToFiftyFour",
        "55-64" => "FiftyFiveToSixtyFour",
        "65-older" => "SixtyFiveOrOlder",
        "Unknown" => "Unknown"
        ];
        
         $maritalStatus = [
        "Single" => "144",
        "Married" => "143",
        "Divorced" => "676",
        ];
        
        $data = [
            "FirstName" => $request['data']['Name'],
            "Email" => $request['data']['Email'],
            "Gender" => $request['data']['Gender'],
            "MaritalStatusValueId" =>$maritalStatus[$marital] ?? '144',
            "PrimaryCampusId" => $request['data']['PrimaryCampusId'],
            "ConnectionStatusValueId" => $request['data']['ConnectionStatusValueId'],
            "AgeBracket" => $ageBrackets[$ageValue] ?? 'Unknown',
            "PhoneNumbers" => [
                [
                    "FullNumber" => $request['data']['Phone'],
                    "Number" => preg_replace('/^\+?[0-9]{1,3}/', '', $request['data']['Phone']),
                    "CountryCode" => $countryCode,
                    "IsSystem" => false,
                    "NumberTypeValueId" => 1,
                    "IsMessagingEnabled" => true
                ]
            ],
        ];

        $PeopleID = $request['data']['PeopleID'];
        $locationId = $request['extras']['locationId'];
        $credentials = getCredentials($locationId);
        $apikey = $credentials->apikey;
        $baseUrl = $credentials->baseUrl;
        if (empty($apikey) || empty($baseUrl)) {
            return response()->json([
                'status' => 402,
                'message' => 'Please provide the API key & Base URL',
            ]);
        }
        $response = rockApiCall($baseUrl, '/api/People/' . $PeopleID, $apikey, 'POST', $data, []);
        if ($response && is_numeric($response)) {
            return response()->json([
                'status' => 'success',
                'Id' => $response,
            ], 200);
        }

        return response()->json([
            'status' => 'failed',
            'message' => 'Failed to Update person.',
        ], 400);
    }
    // Add A New People In Rock RMS (By Email)
    public function searchPeopleByEmail(Request $request)
    {


        $validated = $request->validate([
            'data.Email' => 'required',
            'extras.locationId' => 'required',
        ]);
        $queryParams = [
            'email' => $request['data']['Email'],
        ];
        $locationId = $request['extras']['locationId'];
        $credentials = getCredentials($locationId);
        $apikey = $credentials->apikey;
        $baseUrl = $credentials->baseUrl;

        if (empty($apikey) || empty($baseUrl)) {
            return response()->json([
                'status' => 402,
                'message' => 'Please provide the API key & Base URL',
            ]);
        }
        $response = rockApiCall($baseUrl, '/api/People/GetByEmail', $apikey, 'GET', [], $queryParams);
        save_logs('searchPeopleByEmail', json_encode($response), '455');
        if (isset($response[0]['PhoneNumbers'][0]['PersonId']) && is_numeric($response[0]['PhoneNumbers'][0]['PersonId']) && $response[0]['PhoneNumbers'][0]['PersonId'] !== null && $response[0]['PhoneNumbers'][0]['PersonId'] !== '') {
            $personID = $response[0]['PhoneNumbers'][0]['PersonId'];
            return response()->json([
                'status' => 'success',
                'PersonId' => $personID,
            ], 200);
        } else {
            return response()->json([
                'status' => 'failed',
                'PersonId' => null,
            ], 400);
        }
    }
    // Add A New People In Rock RMS (By Phone)
    public function searchPeopleByPhone(Request $request)
    {
        $validated = $request->validate([
            'data.Phone' => 'required',
            'extras.locationId' => 'required',
        ]);
        $locationId = $request['extras']['locationId'];
        $phone = $request['data']['Phone'];
        $phone = preg_replace('/[^\d]/', '', $phone);

        if (strlen($phone) > 10) {
            $phone = substr($phone, -10);
        }
        $locationId = $request['extras']['locationId'];
        $credentials = getCredentials($locationId);
        $apikey = $credentials->apikey;
        $baseUrl = $credentials->baseUrl;
        if (empty($apikey) || empty($baseUrl)) {
            return response()->json([
                'status' => 402,
                'message' => 'Please provide the API key & Base URL',
            ]);
        }
        $response = rockApiCall($baseUrl, '/api/People/GetByPhoneNumber/' . $phone, $apikey, 'GET', [], []);
        save_logs('searchPeopleByPhone', json_encode($response), $phone);
        if (isset($response[0]['PhoneNumbers'][0]['PersonId']) && is_numeric($response[0]['PhoneNumbers'][0]['PersonId']) && $response[0]['PhoneNumbers'][0]['PersonId'] !== null && $response[0]['PhoneNumbers'][0]['PersonId'] !== '') {
            $personID  = $response[0]['PhoneNumbers'][0]['PersonId'];
            return response()->json([
                'status' => 'success',
                'PersonId' => $personID,
            ], 200);
        } else {
    
            return response()->json([
                'status' => 'failed',
                'PersonId' => null,
            ], 400);
        }
    }
    // Get Campuses Names
    public function getCampuses(Request $request)
    {
        
        $locationId = $request->header('locationId');
        $credentials = getCredentials($locationId);
        $apikey = $credentials->apikey;
        $baseUrl = $credentials->baseUrl;
        if (empty($apikey) || empty($baseUrl)) {
            return response()->json([
                'status' => 402,
                'message' => 'Please provide the API key & Base URL',
            ]);
        }
        $response = rockApiCall($baseUrl, '/api/Campuses', $apikey, 'GET', [], []);

        $options = array_map(function ($campus) {
            return [
                'label' => $campus['Name'],
                'value' => $campus['Id'],
            ];
        }, $response);

        return response()->json(['options' => $options]);
    }
    // Get Tags Names
    public function getTags(Request $request)
    {
        $locationId = $request->header('locationId');
        $credentials = getCredentials($locationId);
        $apikey = $credentials->apikey;
        $baseUrl = $credentials->baseUrl;
        if (empty($apikey) || empty($baseUrl)) {
            return response()->json([
                'status' => 402,
                'message' => 'Please provide the API key & Base URL',
            ]);
        }
        $response = rockApiCall($baseUrl, '/api/Tags', $apikey, 'GET', [], []);

        $options = array_map(function ($campus) {
            return [
                'label' => $campus['Name'],
                'value' => $campus['Id'],
            ];
        }, $response);

        return response()->json(['options' => $options]);
    }
    // Get Tags Connection Status
    public function getConnectionStatus(Request $request)
    {
        $locationId = $request->header('locationId');
        $credentials = getCredentials($locationId);
        $apikey = $credentials->apikey;
        $baseUrl = $credentials->baseUrl;
        if (empty($apikey) || empty($baseUrl)) {
            return response()->json([
                'status' => 402,
                'message' => 'Please provide the API key & Base URL',
            ]);
        }
        $response = rockApiCall($baseUrl, '/api/ConnectionStatus', $apikey, 'GET', [], []);

        $options = array_map(function ($campus) {
            return [
                'label' => $campus['Name'],
                'value' => $campus['Id'],
            ];
        }, $response);

        return response()->json(['options' => $options]);
    }
}
