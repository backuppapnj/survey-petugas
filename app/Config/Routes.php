<?php

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */
$routes->get('/', 'Home::index');

$routes->group('api', ['namespace' => 'App\Controllers\Api'], static function ($routes) {
    $routes->post('login', 'AuthController::login');
    $routes->get('petugas/(:num)', 'PetugasController::show/$1');
    $routes->post('survei', 'SurveiController::submit');
    $routes->get('uploads/(:any)', 'UploadsController::show/$1');

    $routes->group('admin', ['filter' => 'jwt'], static function ($routes) {
        $routes->get('petugas', 'PetugasController::index');
        $routes->post('petugas', 'PetugasController::create');
        $routes->put('petugas/(:num)', 'PetugasController::update/$1');
        $routes->delete('petugas/(:num)', 'PetugasController::delete/$1');
        $routes->get('survei/rekap', 'SurveiController::rekap');
    });
});
