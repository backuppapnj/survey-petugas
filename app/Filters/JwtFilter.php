<?php

namespace App\Filters;

use App\Libraries\JwtLibrary;
use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

class JwtFilter implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
        $authHeader = $request->getHeaderLine('Authorization');

        if ($authHeader === '' || ! str_starts_with($authHeader, 'Bearer ')) {
            return service('response')
                ->setStatusCode(401)
                ->setJSON(['status' => 401, 'error' => 'Token tidak ditemukan']);
        }

        $token   = substr($authHeader, 7);
        $jwt     = new JwtLibrary();
        $decoded = $jwt->decode($token);

        if ($decoded === null) {
            return service('response')
                ->setStatusCode(401)
                ->setJSON(['status' => 401, 'error' => 'Token tidak valid atau sudah kadaluarsa']);
        }

        // Tolak token yang sudah dicabut (mis. setelah logout / revocation).
        if (isset($decoded->jti) && $jwt->isRevoked((string) $decoded->jti)) {
            return service('response')
                ->setStatusCode(401)
                ->setJSON(['status' => 401, 'error' => 'Token sudah dicabut, silakan login kembali']);
        }

        // Simpan payload ke service singleton agar bisa diakses controller
        service('jwtAuth')->setPayload($decoded);
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
        // tidak ada operasi setelah response
    }
}
