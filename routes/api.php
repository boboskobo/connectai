<?php

use App\Http\Controllers\Webhook\WebhookController;
use Illuminate\Support\Facades\Route;


Route::post('/webhook', [WebhookController::class, 'webhook']);

Route::post('/add/people', [WebhookController::class, 'addPeople']);

Route::post('/search/people/email', [WebhookController::class, 'searchPeopleByEmail']);

Route::post('/search/people/phone', [WebhookController::class, 'searchPeopleByPhone']);

Route::get('/get/campuses', [WebhookController::class, 'getCampuses']);

Route::post('/update/people', [WebhookController::class, 'updatePeople']);

Route::get('/get/tags', [WebhookController::class, 'getTags']);

Route::get('/get/connection/status', [WebhookController::class, 'getConnectionStatus']);
