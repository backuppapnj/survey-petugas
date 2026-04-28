<?php

namespace App\Controllers\Api;

use App\Libraries\JwtLibrary;
use App\Models\AdminModel;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;

class AuthController extends ResourceController
{
    public function login(): ResponseInterface
    {
        $json  = $this->request->getJSON(true) ?? [];
        $rules = [
            'username' => 'required|string',
            'password' => 'required|string',
        ];

        if (! $this->validateData($json, $rules)) {
            return $this->response->setStatusCode(422)->setJSON([
                'status'   => 422,
                'error'    => 'Validation Error',
                'messages' => $this->validator->getErrors(),
            ]);
        }

        $admin = (new AdminModel())->findByUsername($json['username']);

        if ($admin === null || ! password_verify($json['password'], $admin['password_hash'])) {
            return $this->response->setStatusCode(401)->setJSON([
                'status' => 401,
                'error'  => 'Username atau password salah',
            ]);
        }

        $token = (new JwtLibrary())->encode([
            'admin_id' => (int) $admin['id'],
            'username' => $admin['username'],
        ]);

        return $this->response->setJSON([
            'token' => $token,
            'admin' => [
                'id'       => (int) $admin['id'],
                'username' => $admin['username'],
                'nama'     => $admin['nama'],
            ],
        ]);
    }
}
