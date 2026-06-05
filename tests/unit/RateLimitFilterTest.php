<?php

namespace Tests\Unit;

use App\Filters\RateLimitFilter;
use PHPUnit\Framework\TestCase;

/**
 * Test double untuk RequestInterface.
 * Hanya mengimplementasikan method yang diperlukan untuk testing.
 *
 * @method string getIPAddress()
 * @method string getPath()
 */
class TestRequestDouble
{
    private string $ip;
    private string $path;

    public function __construct(string $ip = '127.0.0.1', string $path = '/')
    {
        $this->ip = $ip;
        $this->path = $path;
    }

    public function getIPAddress(): string
    {
        return $this->ip;
    }

    public function getPath(): string
    {
        return $this->path;
    }
}

class RateLimitFilterTest extends TestCase
{
    private RateLimitFilter $filter;

    protected function setUp(): void
    {
        parent::setUp();
        $this->filter = new RateLimitFilter();
        RateLimitFilter::clearCache();
    }

    public function testRateLimitAllowsFirstRequest(): void
    {
        $request = new TestRequestDouble('127.0.0.1', '/api/login');

        // Should not return response (request allowed)
        $result = $this->filter->before($request);
        $this->assertNull($result);
    }

    public function testRateLimitBlocksExcessiveRequests(): void
    {
        $request = new TestRequestDouble('127.0.0.1', '/api/login');

        // Simulate 5 requests
        for ($i = 0; $i < 5; $i++) {
            $result = $this->filter->before($request);
            $this->assertNull($result, "Request $i should be allowed");
        }

        // 6th request should be blocked
        $result = $this->filter->before($request);
        $this->assertNotNull($result);
        $this->assertEquals(429, $result->getStatusCode());
    }

    public function testRateLimitOnlyAppliesToAuthEndpoints(): void
    {
        $request = new TestRequestDouble('127.0.0.1', '/api/petugas');

        // Should not rate limit non-auth endpoints
        $result = $this->filter->before($request);
        $this->assertNull($result);

        // Even with many requests
        for ($i = 0; $i < 10; $i++) {
            $result = $this->filter->before($request);
            $this->assertNull($result, "Non-auth endpoint should not be rate limited");
        }
    }

    public function testRateLimitIncludesRetryAfterHeader(): void
    {
        $request = new TestRequestDouble('127.0.0.1', '/api/login');

        // Exhaust rate limit
        for ($i = 0; $i < 6; $i++) {
            $this->filter->before($request);
        }

        $result = $this->filter->before($request);
        $this->assertNotNull($result);
        $this->assertTrue($result->hasHeader('Retry-After'));
    }

    public function testRateLimitSeparatesDifferentEndpoints(): void
    {
        // Request login from one IP
        $loginRequest = new TestRequestDouble('192.168.1.1', '/api/login');
        // Request auth from same IP but different endpoint
        $authRequest = new TestRequestDouble('192.168.1.1', '/api/auth');

        // Both should allow first request
        $result1 = $this->filter->before($loginRequest);
        $this->assertNull($result1);

        $result2 = $this->filter->before($authRequest);
        $this->assertNull($result2);
    }

    public function testRateLimitSeparatesDifferentIPs(): void
    {
        // Two different IPs hitting same endpoint
        $request1 = new TestRequestDouble('192.168.1.100', '/api/login');
        $request2 = new TestRequestDouble('192.168.1.101', '/api/login');

        // Exhaust rate limit for request1
        for ($i = 0; $i < 5; $i++) {
            $this->filter->before($request1);
        }

        // request2 should still be allowed (different IP)
        $result = $this->filter->before($request2);
        $this->assertNull($result);
    }

    public function testRateLimitErrorMessageInIndonesian(): void
    {
        $request = new TestRequestDouble('127.0.0.1', '/api/login');

        // Exhaust rate limit
        for ($i = 0; $i < 6; $i++) {
            $this->filter->before($request);
        }

        $result = $this->filter->before($request);
        $body = json_decode($result->getBody(), true);

        $this->assertArrayHasKey('error', $body);
        $this->assertStringContainsString('Terlalu banyak', $body['error']);
        $this->assertStringContainsString('detik', $body['error']);
    }
}