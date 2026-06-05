<?php

namespace App\Libraries;

use CodeIgniter\Config\Services;
use RuntimeException;
use Throwable;

/**
 * Data Encryption Library
 *
 * Enkripsi field-level untuk data sensitif menggunakan encryption service
 * bawaan CodeIgniter (OpenSSL AES-256-CTR). Driver OpenSSL dipilih daripada
 * Sodium demi kompatibilitas shared hosting (ekstensi libsodium tidak selalu
 * tersedia, sedangkan OpenSSL hampir universal).
 *
 * Contoh:
 *   $crypto    = new DataEncryption();
 *   $encrypted = $crypto->encrypt('data sensitif');   // string
 *   $plain     = $crypto->decrypt($encrypted);         // string|null (null bila gagal)
 */
class DataEncryption
{
    /**
     * @var \CodeIgniter\Encryption\EncrypterInterface
     */
    private $encrypter;

    /**
     * Kunci rahasia untuk HMAC (hashing yang dapat dicari namun irreversible).
     */
    private string $hmacKey;

    public function __construct()
    {
        $this->encrypter = Services::encrypter();

        // HMAC key diturunkan dari encryption key yang WAJIB sudah dikonfigurasi.
        // Jika kosong, tolak beroperasi (fail-closed) alih-alih memakai '' diam-diam.
        $key = (string) env('encryption.key', '');
        if ($key === '') {
            throw new RuntimeException(
                'encryption.key belum dikonfigurasi. Set di .env (mis.: php spark key:generate).'
            );
        }
        $this->hmacKey = $key;
    }

    /**
     * Enkripsi data sensitif sebelum disimpan ke database.
     *
     * @param string $data Teks asli yang akan dienkripsi
     * @return string Ciphertext (base64). String kosong untuk input kosong.
     */
    public function encrypt(string $data): string
    {
        // Gunakan perbandingan ketat: '0' adalah data valid, bukan "kosong".
        if ($data === '') {
            return '';
        }

        return base64_encode($this->encrypter->encrypt($data));
    }

    /**
     * Dekripsi data dari database.
     *
     * @param string $encryptedData Ciphertext base64 dari encrypt()
     * @return string|null Teks asli; '' bila input kosong; null bila dekripsi
     *                     gagal (base64 rusak / tampering / kunci salah).
     */
    public function decrypt(string $encryptedData): ?string
    {
        if ($encryptedData === '') {
            return '';
        }

        $decoded = base64_decode($encryptedData, true);
        if ($decoded === false) {
            // Input bukan base64 valid — sinyalkan kegagalan, jangan samarkan jadi ''.
            return null;
        }

        try {
            return $this->encrypter->decrypt($decoded);
        } catch (Throwable $e) {
            // Kegagalan autentikasi/dekripsi (mis. data dimanipulasi) dicatat
            // dan dikembalikan sebagai null agar pemanggil menangani eksplisit.
            log_message('error', 'Dekripsi gagal: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Hash data sensitif yang tidak perlu didekripsi namun bisa dicari
     * (mis. untuk indexing/deduplikasi). Menggunakan HMAC-SHA256 berkunci
     * (bukan SHA-256 polos) sehingga tahan terhadap serangan rainbow table.
     *
     * @param string $data Teks asli
     * @return string HMAC-SHA256 (64 karakter hex). '' untuk input kosong.
     */
    public function hash(string $data): string
    {
        if ($data === '') {
            return '';
        }

        return hash_hmac('sha256', $data, $this->hmacKey);
    }

    /**
     * Verifikasi sebuah hash cocok dengan data, secara constant-time.
     *
     * @param string $data Teks asli
     * @param string $hash Hash yang diharapkan
     * @return bool True bila cocok
     */
    public function verifyHash(string $data, string $hash): bool
    {
        return hash_equals($this->hash($data), $hash);
    }
}
