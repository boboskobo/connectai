<?php

use App\Http\Controllers\CRM\CRMController;
use App\Http\Controllers\CustomPage\CustomPageController;
use App\Http\Controllers\Dashboard\DashboardController;
use Illuminate\Support\Facades\Route;


// Dashbaord Route
Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

// Callback Route
Route::get('callback', [CRMController::class, 'index'])->name('callback');

// Custom Page Route
Route::get('custom/page', [CustomPageController::class, 'index'])->name('custom.index');
Route::post('custom', [CustomPageController::class, 'save'])->name('custom.save');


