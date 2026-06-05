<?php

namespace App\Libraries;

use CodeIgniter\Config\Services;

/**
 * Data Encryption Library
 *
 * Provides field-level encryption for sensitive data using CodeIgniter's
 * encryption service with AES-256-CTR.
 *
 * Usage:
 * $encrypter = new DataEncryption();
 * $encrypted = $encrypter->encrypt('sensitive data');
 * $decrypted = $encrypter->decrypt($encrypted);
 */
class DataEncryption
{
    /**
     * @var \CodeIgniter\Encryption\EncrypterInterface
     */
    private $encrypter;

    /**
     * Initialize the encryption service.
     */
    public function __construct()
    {
        $this->encrypter = Services::encrypter();
    }

    /**
     * Encrypt sensitive field data before database storage.
     *
     * @param string $data Plain text data to encrypt
     * @return string Encrypted data (base64 encoded)
     */
    public function encrypt(string $data): string
    {
        if (empty($data)) {
            return '';
        }

        $encrypted = $this->encrypter->encrypt($data);
        return base64_encode($encrypted);
    }

    /**
     * Decrypt field data retrieved from database.
     *
     * @param string $encryptedData Base64 encoded encrypted data
     * @return string Decrypted plain text
     */
    public function decrypt(string $encryptedData): string
    {
        if (empty($encryptedData)) {
            return '';
        }

        try {
            $decoded = base64_decode($encryptedData, true);
            if ($decoded === false) {
                return '';
            }
            return $this->encrypter->decrypt($decoded);
        } catch (\Throwable $e) {
            log_message('error', 'Decryption failed: ' . $e->getMessage());
            return '';
        }
    }

    /**
     * Hash sensitive data that should never be decrypted (e.g., for search/indexing).
     * Uses SHA-256 with application salt.
     *
     * @param string $data Plain text data to hash
     * @return string Hashed data (hex encoded)
     */
    public function hash(string $data): string
    {
        if (empty($data)) {
            return '';
        }

        $salt = env('APP_SALT', '');
        return hash('sha256', $data . $salt);
    }

    /**
     * Verify that a hash matches the data.
     *
     * @param string $data Plain text data
     * @param string $hash Expected hash
     * @return bool True if hash matches
     */
    public function verifyHash(string $data, string $hash): bool
    {
        return hash_equals($hash, $this->hash($data));
    }
}