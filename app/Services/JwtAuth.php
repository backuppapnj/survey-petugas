<?php

namespace App\Services;

/**
 * Singleton untuk menyimpan payload JWT yang sudah di-decode oleh filter,
 * sehingga controller dapat mengaksesnya tanpa decode ulang.
 */
class JwtAuth
{
    private ?object $payload = null;

    public function setPayload(object $payload): void
    {
        $this->payload = $payload;
    }

    public function getPayload(): ?object
    {
        return $this->payload;
    }

    public function getAdminId(): ?int
    {
        return isset($this->payload->admin_id) ? (int) $this->payload->admin_id : null;
    }
}
