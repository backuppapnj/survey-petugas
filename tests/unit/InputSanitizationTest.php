<?php

namespace Tests\Unit;

use App\Models\SurveiModel;
use PHPUnit\Framework\TestCase;

class InputSanitizationTest extends TestCase
{
    /**
     * Test that XSS payloads in saran field are sanitized.
     */
    public function testSaranFieldSanitizesXSSPayload(): void
    {
        $model = new SurveiModel();

        // XSS payload - strip_tags removes the entire <script> block including content
        $maliciousInput = '<script>alert("XSS")</script>Pertanyaan?';
        $expectedOutput = 'alert(&quot;XSS&quot;)Pertanyaan?';

        // Use reflection to test the sanitization method
        $reflection = new \ReflectionClass($model);
        $method = $reflection->getMethod('sanitizeSaran');
        $method->setAccessible(true);

        $data = ['data' => ['saran' => $maliciousInput]];
        $result = $method->invoke($model, $data);

        $this->assertEquals($expectedOutput, $result['data']['saran']);
    }

    /**
     * Test that HTML tags are stripped from saran field.
     */
    public function testSaranFieldStripsHTMLTags(): void
    {
        $model = new SurveiModel();

        $inputWithHtml = '<b>Bold</b> and <i>italic</i> text';
        $expectedOutput = 'Bold and italic text';

        $reflection = new \ReflectionClass($model);
        $method = $reflection->getMethod('sanitizeSaran');
        $method->setAccessible(true);

        $data = ['data' => ['saran' => $inputWithHtml]];
        $result = $method->invoke($model, $data);

        $this->assertEquals($expectedOutput, $result['data']['saran']);
    }

    /**
     * Test that NULL saran field is handled correctly.
     */
    public function testSaranFieldHandlesNull(): void
    {
        $model = new SurveiModel();

        $reflection = new \ReflectionClass($model);
        $method = $reflection->getMethod('sanitizeSaran');
        $method->setAccessible(true);

        $data = ['data' => ['saran' => null]];
        $result = $method->invoke($model, $data);

        $this->assertNull($result['data']['saran']);
    }

    /**
     * Test that empty saran field is handled correctly.
     */
    public function testSaranFieldHandlesEmptyString(): void
    {
        $model = new SurveiModel();

        $reflection = new \ReflectionClass($model);
        $method = $reflection->getMethod('sanitizeSaran');
        $method->setAccessible(true);

        $data = ['data' => ['saran' => '']];
        $result = $method->invoke($model, $data);

        $this->assertEquals('', $result['data']['saran']);
    }

    /**
     * Memastikan saran dengan teks normal (tanpa HTML) tetap utuh.
     */
    public function testSaranFieldPreservesPlainText(): void
    {
        $model = new SurveiModel();

        $plainText = 'Pelayanan sangat baik dan cepat. Terima kasih!';

        $reflection = new \ReflectionClass($model);
        $method = $reflection->getMethod('sanitizeSaran');
        $method->setAccessible(true);

        $data = ['data' => ['saran' => $plainText]];
        $result = $method->invoke($model, $data);

        $this->assertEquals($plainText, $result['data']['saran']);
    }
}