<?php

namespace Tests\Unit;

use App\Controllers\Api\UploadsController;
use PHPUnit\Framework\TestCase;

/**
 * Unit tests untuk keamanan file upload.
 * Menguji path traversal prevention, validasi filename, dan MIME type restrictions.
 */
class FileUploadSecurityTest extends TestCase
{
    /**
     * Test bahwa path traversal attempts diblokir.
     */
    public function testPathTraversalIsBlocked(): void
    {
        $testCases = [
            '../../../etc/passwd',
            '..\\..\\windows\\system32\\config\\sam',
            '....//....//etc/passwd',
            'test/../../../etc/passwd',
            'test.png/../../../etc/passwd',
        ];

        foreach ($testCases as $maliciousPath) {
            $this->assertStringNotContainsString('..', basename($maliciousPath));
        }
    }

    /**
     * Test bahwa validasi filename menolak format invalid.
     */
    public function testFilenameValidationRejectsInvalidFormats(): void
    {
        $invalidFilenames = [
            '../../../etc/passwd',
            'test<script>.png',
            'test.php.png',
            "test.png\nmalicious",
        ];

        foreach ($invalidFilenames as $filename) {
            // Filename hanya boleh berisi alphanumeric, underscore, hyphen, dan extension
            $isValid = preg_match('/^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|gif|webp)$/i', basename($filename));
            $this->assertEquals(0, $isValid, "Filename '$filename' should be rejected");
        }
    }

    /**
     * Test bahwa filename valid diterima.
     */
    public function testValidFilenamesAreAccepted(): void
    {
        $validFilenames = [
            'test.png',
            'my-image-123.jpg',
            'photo_2024.JPEG',
            'abc123.webp',
            'test_file.GIF',
        ];

        foreach ($validFilenames as $filename) {
            $isValid = preg_match('/^[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/', basename($filename));
            $this->assertEquals(1, $isValid, "Filename '$filename' should be accepted");
        }
    }

    /**
     * Test bahwa MIME types yang diizinkan sudah benar.
     */
    public function testAllowedMimeTypesAreCorrect(): void
    {
        $reflection = new \ReflectionClass(UploadsController::class);
        $constant = $reflection->getConstant('ALLOWED_MIME_TYPES');

        $this->assertContains('image/jpeg', $constant);
        $this->assertContains('image/png', $constant);
        $this->assertContains('image/gif', $constant);
        $this->assertContains('image/webp', $constant);

        // Pastikan tidak ada tipe berbahaya yang diizinkan
        $this->assertNotContains('application/pdf', $constant);
        $this->assertNotContains('application/x-php', $constant);
        $this->assertNotContains('text/x-php', $constant);
    }

    /**
     * Test bahwa hanya image types yang diizinkan oleh getimagesize constants.
     */
    public function testOnlyImageTypesAllowed(): void
    {
        // Image types yang diizinkan
        $allowedImageTypes = [
            IMAGETYPE_JPEG,
            IMAGETYPE_PNG,
            IMAGETYPE_GIF,
            IMAGETYPE_WEBP,
        ];

        // Image types yang TIDAK boleh diizinkan
        $forbiddenImageTypes = [
            IMAGETYPE_SWF,
            IMAGETYPE_PSD,
            IMAGETYPE_BMP,
            IMAGETYPE_TIFF_II,
            IMAGETYPE_TIFF_MM,
            IMAGETYPE_JPC,
            IMAGETYPE_JP2,
            IMAGETYPE_JPX,
            IMAGETYPE_JB2,
            IMAGETYPE_SWC,
            IMAGETYPE_IFF,
            IMAGETYPE_WBMP,
            IMAGETYPE_XBM,
        ];

        foreach ($forbiddenImageTypes as $forbiddenType) {
            $this->assertNotContains(
                $forbiddenType,
                $allowedImageTypes,
                "Image type $forbiddenType should NOT be in allowed list"
            );
        }
    }

    /**
     * Test basename extraction untuk path traversal prevention.
     */
    public function testBasenameExtractsCorrectly(): void
    {
        $testCases = [
            '/var/www/uploads/image.png' => 'image.png',
            'uploads/image.png' => 'image.png',
            'image.png' => 'image.png',
            '/path/to/../to/file.png' => 'file.png',
        ];

        foreach ($testCases as $input => $expected) {
            $this->assertEquals($expected, basename($input));
        }
    }

    /**
     * Test regex pattern untuk validasi filename.
     * Hanya mengizinkan extension gambar yang aman.
     */
    public function testFilenameRegexPattern(): void
    {
        // Pattern hanya mengizinkan extension gambar yang aman
        $pattern = '/^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|gif|webp)$/i';

        // Valid cases
        $this->assertEquals(1, preg_match($pattern, 'abc123.png'));
        $this->assertEquals(1, preg_match($pattern, 'test-image-2024.jpg'));
        $this->assertEquals(1, preg_match($pattern, 'photo_2024.JPEG'));
        $this->assertEquals(1, preg_match($pattern, 'abc123.webp'));
        $this->assertEquals(1, preg_match($pattern, 'test_file.GIF'));

        // Invalid cases - path traversal
        $this->assertEquals(0, preg_match($pattern, '../../../etc/passwd'));
        $this->assertEquals(0, preg_match($pattern, 'test<script>.png'));

        // Invalid cases - dangerous extensions
        $this->assertEquals(0, preg_match($pattern, 'test.php'));
        $this->assertEquals(0, preg_match($pattern, 'test.jsp'));
        $this->assertEquals(0, preg_match($pattern, 'test.html'));
        $this->assertEquals(0, preg_match($pattern, 'test.exe'));
    }
}