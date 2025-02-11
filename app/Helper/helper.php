<?php

use App\Models\AppCredential;
use App\Models\Credential;
use App\Models\ErrorLog;
use App\Models\Setting;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;

// GHL Oauth Call
function ghl_oauth_call($code = '', $method = '')
{
    $cred = getAppCredentials();

    $url = 'https://api.msgsndr.com/oauth/token';
    $curl = curl_init();
    $data = [];
    $data['client_id'] = $cred['client_id'];
    $data['client_secret'] = $cred['client_secret'];
    $md = empty($method) ? 'code' : 'refresh_token';
    $data[$md] = $code;
    $data['grant_type'] = empty($method) ? 'authorization_code' : 'refresh_token';
    $postv = '';
    $x = 0;

    foreach ($data as $key => $value) {
        if ($x > 0) {
            $postv .= '&';
        }
        $postv .= $key . '=' . $value;
        $x++;
    }

    $curlfields = array(
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_ENCODING => '',
        CURLOPT_MAXREDIRS => 10,
        CURLOPT_TIMEOUT => 0,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
        CURLOPT_CUSTOMREQUEST => 'POST',
        CURLOPT_POSTFIELDS => $postv,
    );
    curl_setopt_array($curl, $curlfields);

    $response = curl_exec($curl);
    $response = json_decode($response);
    curl_close($curl);
    return $response;
}

// GHL GET  Token
function ghl_token($request, $type = '')
{
    $code = $request->code;
    $code  =  ghl_oauth_call($code, $type);

    if ($code) {

        if (property_exists($code, 'access_token')) {
            if (empty($type)) {

                return $code;
            }
        } else {
            if (property_exists($code, 'error_description')) {
                if (empty($type)) {
                    return view('error-message');
                }
            }
            return null;
        }
    }
    if (empty($type)) {
        return view('error-message');
    }
}

// CRM API CALL
function ghl_api_call($url, $method, $data, $locationId, $json = false)
{
    $baseurl = 'https://services.leadconnectorhq.com/';

    $location = $locationId;
    $token = getLocationToken($location);
    $bearer = 'Bearer ' . $token->access_token;


    if (empty($token)) {

        save_logs('ghl_api_call', 'No Token Found', $locationId);
    }

    $version = get_default_settings('oauth_ghl_version', '2021-04-15');

    $headers = [
        'Version' => $version,
        'Authorization' => $bearer,
        'Content-Type' => 'application/json',
        'Accept' => 'application/json',
    ];

    if (strtolower($method) === 'get') {
        $url .= (strpos($url, '?') !== false) ? '&' : '?';
        if (strpos($url, 'locationId=') === false) {
            $url .= 'locationId=' . $location;
        }
    }

    $client = new \GuzzleHttp\Client(['http_errors' => false, 'headers' => $headers]);
    $options = [];
    if (!empty($data)) {
        $options['body'] = $data;
    }

    $url1 = $baseurl . $url;

    try {
        $response = $client->request($method, $url1, $options);
        $bd = $response->getBody()->getContents();
        $bd = json_decode($bd);
        if (isset($bd->error) && $bd->error === 'Unauthorized') {
            $refreshToken = getLocationToken($locationId);
            $newTokenRes = newAccessToken($refreshToken->refresh_token);
            saveNewAccessTokens($newTokenRes);
            $newToken = $newTokenRes->access_token;
            return ghl_api_call($url, $method, $data, $newToken, $locationId, $json);
        }
        return $bd;
    } catch (\GuzzleHttp\Exception\RequestException $e) {
        save_logs('ghl_api_call', $e->getMessage(), $locationId);
    } catch (\Exception $e) {
        save_logs('ghl_api_call', $e->getMessage(), $locationId);
    }
}

// Get Default Setting
function get_default_settings($j, $k)
{
    return $k;
}

// Save Logs
function save_logs($source, $message, $locationId)
{
    $logs = new ErrorLog();
    $logs->location_id = $locationId;
    $logs->source = $source;
    $logs->message = $message;
    $logs->Save();
}

// Get Location Token
function getLocationToken($locationId)
{

    $setting_res = Setting::where('location_id', $locationId)->first();
    if (!$setting_res) {
        return response()->json([
            'message' => "No user found.",
            'code' => 404,
        ], 404);
    }
    return $setting_res;
}

// Get New Access Token
function newAccessToken($refreshToken)
{
    $url = 'https://api.msgsndr.com/oauth/token';
    $data = [
        'client_id' => getAppCredentials()->client_id,
        'client_secret' => getAppCredentials()->client_secret,
        'refresh_token' => $refreshToken,
        'grant_type' => 'refresh_token'
    ];

    $curl = curl_init();
    curl_setopt_array($curl, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => http_build_query($data),
    ]);

    $response = curl_exec($curl);
    curl_close($curl);
    return json_decode($response);
}

// Save a new access token
function saveNewAccessTokens($tokensData)
{
    try {
        $setting = Setting::where('location_id', $tokensData->locationId)->first();

        if (!$setting) {
            $setting = new Setting();
        }
        $setting->location_id = $tokensData->locationId;
        $setting->access_token = $tokensData->access_token;
        $setting->refresh_token = $tokensData->refresh_token;
        $setting->save();
        return $setting;
    } catch (\Throwable $th) {

        save_logs('saveNewAccessTokens', $th->getMessage(), $tokensData->locationId);
    }
}

// Get Gateway Credentials
function getCredentials($locationId)
{

    $Credentials = Credential::where('location_id', $locationId)->first();
    if (!$Credentials) {
        $Credentials = null;
    }
    return $Credentials;
}

// Get App Credentials
function getAppCredentials()
{
    $appCredential = AppCredential::first();
    if (!$appCredential) {
        $appCredential = null;
    }
    return $appCredential;
}

function rockApiCall($baseurl, $url, $apikey, $method = 'GET', $data = [], $queryParams = [])
{
    // https://rock.flatironschurch.com
    $baseurl = $baseurl . $url;
    $client = new Client();
    $headers = [
        'Authorization-Token' => $apikey,
        'Content-Type' => 'application/json',
    ];

    $options = [
        'headers' => $headers,
        'json' => $data,
    ];

    if (!empty($queryParams)) {
        $options['query'] = $queryParams;
    }

    try {

        $response = $client->request($method, $baseurl, $options);
        return json_decode($response->getBody(), true);
    } catch (RequestException $e) {
        save_logs('API CALL', $e->getMessage(),'21112');
    }
}
