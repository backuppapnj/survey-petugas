<?php

namespace Tests\Libraries;

use App\Libraries\DataEncryption;
use CodeIgniter\Test\CIUnitTestCase;

/**
 * Test untuk DataEncryption library (enkripsi field-level data sensitif).
 * Menggunakan encryption.key yang di-set pada phpunit.xml.dist.
 *
 * @internal
 */
final class DataEncryptionTest extends CIUnitTestCase
{
    private DataEncryption $encrypter;

    protected function setUp(): void
    {
        parent::setUp();
        $this->encrypter = new DataEncryption();
    }

    public function testEncryptDanDecryptMengembalikanDataAsli(): void
    {
        $plaintext = 'Data sensitif responden';
        $encrypted = $this->encrypter->encrypt($plaintext);

        // Ciphertext harus berbeda dari plaintext
        $this->assertNotSame($plaintext, $encrypted);
        // Dekripsi harus mengembalikan plaintext asli
        $this->assertSame($plaintext, $this->encrypter->decrypt($encrypted));
    }

    public function testEnkripsiMenghasilkanCiphertextBerbeda(): void
    {
        $plaintext = 'Teks uji';

        $encrypted1 = $this->encrypter->encrypt($plaintext);
        $encrypted2 = $this->encrypter->encrypt($plaintext);

        // Setiap enkripsi menghasilkan ciphertext berbeda (karena nonce/IV acak)
        $this->assertNotSame($encrypted1, $encrypted2);
        // Namun keduanya terdekripsi ke plaintext yang sama
        $this->assertSame($plaintext, $this->encrypter->decrypt($encrypted1));
        $this->assertSame($plaintext, $this->encrypter->decrypt($encrypted2));
    }

    public function testStringKosongMengembalikanStringKosong(): void
    {
        $this->assertSame('', $this->encrypter->encrypt(''));
        $this->assertSame('', $this->encrypter->decrypt(''));
    }

    public function testNilaiNolBukanDianggapKosong(): void
    {
        // '0' adalah data valid (PHP empty() keliru menganggapnya kosong).
        $encrypted = $this->encrypter->encrypt('0');
        $this->assertNotSame('', $encrypted);
        $this->assertSame('0', $this->encrypter->decrypt($encrypted));
    }

    public function testKarakterSpesialDanUnicode(): void
    {
        $special   = 'Saran: pelayanan "ramah" & cepat 🎉 <tetap aman>';
        $encrypted = $this->encrypter->encrypt($special);

        $this->assertSame($special, $this->encrypter->decrypt($encrypted));
    }

    public function testDecryptInputInvalidMengembalikanNull(): void
    {
        // Base64/ciphertext tidak valid tidak boleh melempar exception, dan
        // harus mengembalikan null (bukan '') agar kegagalan/tampering eksplisit.
        $this->assertNull($this->encrypter->decrypt('bukan-base64-valid!@#'));
    }

    public function testHashKonsistenDan64Karakter(): void
    {
        $data = 'data untuk hashing';
        $hash = $this->encrypter->hash($data);

        // SHA-256 hex = 64 karakter
        $this->assertSame(64, strlen($hash));
        // Data sama menghasilkan hash sama (deterministik)
        $this->assertSame($hash, $this->encrypter->hash($data));
        // Data berbeda menghasilkan hash berbeda
        $this->assertNotSame($hash, $this->encrypter->hash('data lain'));
    }

    public function testVerifyHash(): void
    {
        $data = 'data rahasia';
        $hash = $this->encrypter->hash($data);

        $this->assertTrue($this->encrypter->verifyHash($data, $hash));
        $this->assertFalse($this->encrypter->verifyHash('data dimanipulasi', $hash));
    }

    public function testTeksPanjang(): void
    {
        $longText  = str_repeat('Lorem ipsum dolor sit amet. ', 100);
        $encrypted = $this->encrypter->encrypt($longText);

        $this->assertSame($longText, $this->encrypter->decrypt($encrypted));
    }
}
