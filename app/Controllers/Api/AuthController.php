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
        // Decode body deterministik: body kosong -> [] (gagal validasi 422),
        // JSON rusak -> 400 (bukan 500).
        $raw  = (string) $this->request->getBody();
        $json = $raw === '' ? [] : json_decode($raw, true);
        if (! is_array($json)) {
            return $this->response->setStatusCode(400)->setJSON([
                'status' => 400,
                'error'  => 'Format JSON tidak valid',
            ]);
        }

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
