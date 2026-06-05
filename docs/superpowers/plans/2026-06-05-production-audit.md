# Production Readiness Audit Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Auditing CodeIgniter 4 + React application for production deployment readiness on shared hosting, covering security, encryption, performance, and configuration hardening.

**Architecture:** Audit-based approach with automated scanning + manual code review. Findings categorized by severity (Critical, High, Medium, Low) with remediation tasks.

**Tech Stack:** CodeIgniter 4 (PHP 8.2+), React 19, MySQL, JWT (firebase/php-jwt), Shared Hosting

---

## Tahap 1: Security Audit

### Task 1: JWT Security Hardening

**Files:**
- Modify: `app/Libraries/JwtLibrary.php`
- Modify: `app/Filters/JwtFilter.php`
- Create: `tests/Unit/JwtLibraryTest.php`

**Current Issues Found:**
- Secret key defaults to `'default-secret-key-change-me'` if env not set
- No key strength validation
- Expiry is hardcoded to 86400 (24 hours)
- No token refresh mechanism
- No blacklist/revocation capability

**Audit Steps:**

- [ ] **Step 1: Create JWT security test**

```php
// tests/Unit/JwtLibraryTest.php
public function testJwtEncodeRequiresStrongSecret(): void
{
    // Test that weak/empty secret is rejected
    // Test that minimum key length is enforced (256 bits = 32 bytes)
}

public function testJwtDecodeRejectsExpiredToken(): void
{
    // Test token expiry enforcement
}

public function testJwtDecodeRejectsTamperedToken(): void
{
    // Test signature verification
}
```

- [ ] **Step 2: Run test to verify current behavior fails security checks**

Run: `php spark test tests/Unit/JwtLibraryTest.php`
Expected: Current code should fail strong secret validation

- [ ] **Step 3: Implement secure JWT library**

```php
// app/Libraries/JwtLibrary.php - MODIFIED
namespace App\Libraries;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Throwable;

class JwtLibrary
{
    private string $secretKey;
    private string $algorithm = 'HS256';
    private int $expiry = 86400; // 24 hours

    private const MIN_KEY_LENGTH = 32; // 256 bits

    public function __construct()
    {
        $secret = (string) env('JWT_SECRET_KEY', '');

        if ($secret === '' || strlen($secret) < self::MIN_KEY_LENGTH) {
            throw new \RuntimeException(
                'JWT_SECRET_KEY must be at least ' . self::MIN_KEY_LENGTH . ' characters.'
            );
        }

        $this->secretKey = $secret;
    }

    public function encode(array $payload): string
    {
        $issuedAt = time();
        $merged = array_merge($payload, [
            'iat' => $issuedAt,
            'exp' => $issuedAt + $this->expiry,
            'jti' => bin2hex(random_bytes(16)), // Unique token ID for revocation
        ]);

        return JWT::encode($merged, $this->secretKey, $this->algorithm);
    }

    public function decode(string $token): ?object
    {
        if ($token === '') {
            return null;
        }

        try {
            return JWT::decode($token, new Key($this->secretKey, $this->algorithm));
        } catch (Throwable) {
            return null;
        }
    }

    public function decodeWithExpiry(string $token): ?object
    {
        if ($token === '') {
            return null;
        }

        try {
            $decoded = JWT::decode($token, new Key($this->secretKey, $this->algorithm));
            return $decoded;
        } catch (Throwable $e) {
            // Log expired tokens for monitoring
            if ($e instanceof \Firebase\JWT\ExpiredException) {
                log_message('warning', 'Expired JWT token attempted: ' . $e->getMessage());
            }
            return null;
        }
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `php spark test tests/Unit/JwtLibraryTest.php`
Expected: PASS - strong secret validation working

- [ ] **Step 5: Commit**

```bash
git add app/Libraries/JwtLibrary.php app/Filters/JwtFilter.php tests/Unit/JwtLibraryTest.php
git commit -m "security: harden JWT library with key strength validation and unique token IDs"
```

---

### Task 2: CSRF & Input Validation Hardening

**Files:**
- Modify: `app/Config/Filters.php`
- Modify: `app/Config/Security.php`
- Create: `app/Filters/RateLimitFilter.php`
- Create: `tests/Unit/InputValidationTest.php`

**Current Issues Found:**
- CSRF filter is commented out in globals
- Token names use default 'csrf_test_name'
- No rate limiting on login endpoint
- CORS only allows localhost:5173 (development only)

**Audit Steps:**

- [ ] **Step 1: Create CSRF and rate limit tests**

```php
// tests/Unit/SecurityConfigTest.php
public function testCsrfTokenIsConfigured(): void
{
    $config = new \Config\Security();
    $this->assertNotEquals('csrf_test_name', $config->tokenName);
    $this->assertEquals(7200, $config->expires);
    $this->assertTrue($config->regenerate);
}

public function testLoginEndpointHasRateLimit(): void
{
    // Verify rate limiting is configured for login
}
```

- [ ] **Step 2: Create rate limiting filter**

```php
// app/Filters/RateLimitFilter.php
namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

class RateLimitFilter implements FilterInterface
{
    private const MAX_REQUESTS = 5;      // Max requests
    private const WINDOW_SECONDS = 60;   // Per minute

    // Simple in-memory cache (use Redis in production)
    private static array $hits = [];

    public function before(RequestInterface $request, $arguments = null)
    {
        $ip = $request->getIPAddress();
        $endpoint = $request->getPath();

        // Only rate limit auth endpoints
        if (!preg_match('#/api/(login|auth)#', $endpoint)) {
            return;
        }

        $key = $ip . ':' . $endpoint;
        $now = time();

        if (!isset(self::$hits[$key])) {
            self::$hits[$key] = ['count' => 0, 'window_start' => $now];
        }

        // Reset window if expired
        if ($now - self::$hits[$key]['window_start'] > self::WINDOW_SECONDS) {
            self::$hits[$key] = ['count' => 0, 'window_start' => $now];
        }

        self::$hits[$key]['count']++;

        if (self::$hits[$key]['count'] > self::MAX_REQUESTS) {
            return service('response')
                ->setStatusCode(429)
                ->setJSON([
                    'status' => 429,
                    'error' => 'Terlalu banyak percobaan login. Silakan coba lagi dalam ' .
                               self::WINDOW_SECONDS . ' detik.',
                ])
                ->setHeader('Retry-After', (string) self::WINDOW_SECONDS);
        }
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
        // No action needed
    }
}
```

- [ ] **Step 3: Update Filters.php to enable CSRF and rate limiting**

```php
// app/Config/Filters.php - MODIFIED
public array $globals = [
    'before' => [
        'csrf',           // Enable CSRF protection
        'invalidchars',   // Block invalid characters
    ],
    'after' => [
        'secureheaders',  // Enable security headers
    ],
];

public array $filters = [
    'cors' => ['before' => ['api/*'], 'after' => ['api/*']],
    'ratelimit' => ['before' => ['api/login']],
];
```

- [ ] **Step 4: Update Security.php with production values**

```php
// app/Config/Security.php - MODIFIED
public string $tokenName = 'ci_csrf_token';
public string $cookieName = 'csrf_cookie';
public int $expires = 3600;        // 1 hour (shorter for security)
public bool $tokenRandomize = true; // Randomize token for extra security
```

- [ ] **Step 5: Update Cors.php for production**

```php
// app/Config/Cors.php - MODIFIED (will need dynamic config via .env)
// Allow production domain via environment variable
public array $default = [
    'allowedOrigins' => array_filter([
        env('CORS_ALLOWED_ORIGINS', ''),
    ]),
    'supportsCredentials' => true,
    'allowedHeaders' => ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-TOKEN'],
    'exposedHeaders' => ['X-Total-Count'],
    'allowedMethods' => ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    'maxAge' => 86400,
];
```

- [ ] **Step 6: Run tests and commit**

Run: `php spark test`
Expected: PASS

Commit: `git add -A && git commit -m "security: enable CSRF, rate limiting, and production CORS config"`

---

### Task 3: SQL Injection & XSS Prevention Audit

**Files:**
- Audit: `app/Models/*.php`
- Audit: `app/Controllers/Api/*.php`

**Current Status:**
- Using CodeIgniter Model which provides parameterized queries (GOOD)
- Need to verify all user inputs are properly escaped
- Need to check for stored XSS in survei saran field

**Audit Steps:**

- [ ] **Step 1: Review PetugasModel for mass assignment safety**

Check that `$allowedFields` properly limits which fields can be set via user input.

```php
// Current: protected $allowedFields = ['nama', 'foto', 'loket', 'unit_kerja', 'is_active'];
// is_active should NOT be settable via user input in create/update methods
```

**Findings:**
- `is_active` in allowedFields is dangerous - remove it from mass assignment
- Add explicit method to toggle active status with admin auth check

- [ ] **Step 2: Verify SurveiModel input sanitization**

The `saran` field accepts string but should sanitize HTML/script tags.

```php
// app/Models/SurveiModel.php - Add sanitization
protected function setCreatedAt(array $data): array
{
    if (!isset($data['data']['created_at'])) {
        $data['data']['created_at'] = date('Y-m-d H:i:s');
    }
    return $data;
}

// Add sanitization hook for saran field
protected $validationRules = [
    'saran' => 'max_length[1000]|permit_empty',
];

protected $beforeInsert = ['setCreatedAt', 'sanitizeSaran'];
protected $beforeUpdate = ['sanitizeSaran'];

protected function sanitizeSaran(array $data): array
{
    if (isset($data['data']['saran'])) {
        // Strip HTML tags and encode special characters
        $data['data']['saran'] = strip_tags($data['data']['saran']);
        $data['data']['saran'] = htmlspecialchars($data['data']['saran'], ENT_QUOTES, 'UTF-8');
    }
    return $data;
}
```

- [ ] **Step 3: Add prepared statement verification test**

```php
// tests/Unit/QuerySafetyTest.php
public function testAllModelQueriesUseBindings(): void
{
    // Verify no raw SQL string concatenation
    $model = new \App\Models\PetugasModel();

    // Test with malicious input
    $result = $model->findByUsername("' OR '1'='1");
    $this->assertNull($result); // Should not match anything
}
```

---

### Task 4: File Upload Security Audit

**Files:**
- Modify: `app/Controllers/Api/PetugasController.php`
- Modify: `app/Controllers/Api/UploadsController.php`

**Current Issues Found:**
- File extension validation exists but MIME type could be spoofed
- No file size enforcement in file handler
- Path traversal protection exists but could be bypassed

**Audit Steps:**

- [ ] **Step 1: Create file upload security test**

```php
// tests/Unit/FileUploadSecurityTest.php
public function testRejectedMimeTypeSpoofing(): void
{
    // Test that image with fake MIME is rejected
}

public function testPathTraversalBlocked(): void
{
    // Test ../../etc/passwd is blocked
}
```

- [ ] **Step 2: Enhance file upload validation in PetugasController**

```php
// app/Controllers/Api/PetugasController.php - Enhanced validation

private function validateSecureUpload($file): bool
{
    // Check if file was actually uploaded
    if (!$file || !$file->isValid()) {
        return false;
    }

    // Verify actual MIME type (not just extension)
    $finfo = new \finfo(FILEINFO_MIME_TYPE);
    $mimeType = $finfo->file($file->getTempName());

    $allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!in_array($mimeType, $allowedMimes, true)) {
        return false;
    }

    // Check image dimensions (prevent polyglot attacks)
    $imageInfo = @getimagesize($file->getTempName());
    if ($imageInfo === false || !in_array($imageInfo[2], [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_GIF, IMAGETYPE_WEBP])) {
        return false;
    }

    // Generate random filename to prevent enumeration
    $extension = strtolower($file->getExtension());
    $filename = bin2hex(random_bytes(16)) . '.' . $extension;

    return true;
}
```

- [ ] **Step 3: Add .htaccess protection for uploads directory**

```php
// In WRITEPATH . 'uploads' directory, create .htaccess:
/*
# Prevent direct PHP execution
<FilesMatch "\.php$">
    Order Deny,Allow
    Deny from all
</FilesMatch>

# Prevent script execution
Options -ExecCGI
RemoveHandler .php .php3 .php4 .php5 .phtml .pl .py .cgi

# Prevent directory listing
Options -Indexes

# Only allow image files
<FilesMatch "^[^.]+\.(jpg|jpeg|png|gif|webp)$">
    Order Allow,Deny
    Allow from all
</FilesMatch>
*/
```

---

## Tahap 2: Encryption & Data Protection

### Task 5: Database Encryption Configuration

**Files:**
- Modify: `app/Config/Encryption.php`
- Modify: `.env` (create from env template)
- Create: `app/Libraries/DataEncryption.php`

**Current Issues Found:**
- Encryption key is empty (`public string $key = ''`)
- No field-level encryption for sensitive data (responden names, suggestions)

**Audit Steps:**

- [ ] **Step 1: Generate secure encryption key**

```bash
# Generate 256-bit encryption key for AES-256
openssl rand -hex 32
```

**Expected output:** 64 character hex string

- [ ] **Step 2: Create .env from env template with all required keys**

```bash
# Create .env file with production-ready configuration
CI_ENVIRONMENT = production

app.baseURL = 'https://your-production-domain.com'
app.forceGlobalSecureRequests = true
app.CSPEnabled = true
app.appTimezone = 'Asia/Jakarta'

database.default.hostname = localhost
database.default.database = survey_petugas
database.default.username = your_db_user
database.default.password = your_secure_password
database.default.DBDriver = MySQLi
database.default.charSet = utf8mb4
database.default.DBCollat = utf8mb4_general_ci

encryption.key = <paste-64-char-hex-key-here>
encryption.driver = Sodium

JWT_SECRET_KEY = <generate-64-char-random-string>
JWT_EXPIRY = 3600

session.driver = 'CodeIgniter\Session\Handlers\FileHandler'
session.savePath = WRITEPATH . 'session'
session.expiration = 7200
session.matchIP = false

CORS_ALLOWED_ORIGINS = https://your-production-domain.com

logger.threshold = 9
```

- [ ] **Step 3: Create data encryption library for field-level encryption**

```php
// app/Libraries/DataEncryption.php
namespace App\Libraries;

use CodeIgniter\Config\Services;

class DataEncryption
{
    private $encrypter;

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
        return base64_encode($this->encrypter->encrypt($data));
    }

    /**
     * Decrypt field data retrieved from database.
     *
     * @param string $encryptedData Base64 encoded encrypted data
     * @return string Decrypted plain text
     */
    public function decrypt(string $encryptedData): string
    {
        try {
            return $this->encrypter->decrypt(base64_decode($encryptedData));
        } catch (\Throwable) {
            return ''; // Return empty on decryption failure
        }
    }

    /**
     * Hash sensitive data that should never be decrypted (e.g., for search).
     *
     * @param string $data Plain text data
     * @return string Hashed data
     */
    public function hash(string $data): string
    {
        return hash('sha256', $data . env('APP_SALT', ''));
    }
}
```

- [ ] **Step 4: Document encryption requirements for database**

```
# Database Encryption Requirements for Production

## Sensitive Fields to Encrypt (at-rest encryption):
1. survei.saran - contains respondent feedback/comments
2. Consider encrypting responden session data if added later

## Encryption Implementation:
- Use CodeIgniter's built-in encryption service (AES-256-CTR)
- Key stored in .env (never in code)
- Enable TLS for data in transit (HTTPS)
- MySQL at-rest encryption via database server config if available

## Password Hashing (already implemented correctly):
- Admin passwords: password_hash() with bcrypt (PASSWORD_BCRYPT)
- Verify in AuthController: password_verify() used
```

---

### Task 6: HTTPS & Security Headers Configuration

**Files:**
- Modify: `app/Config/App.php`
- Modify: `public/.htaccess`

**Audit Steps:**

- [ ] **Step 1: Enable Force HTTPS in production**

```php
// app/Config/App.php - MODIFIED
public bool $forceGlobalSecureRequests = true;  // Enable HSTS

// Add to before filter in Filters.php:
'forcehttps' => ['before' => ['*']],  // Force HTTPS for all routes
```

- [ ] **Step 2: Add security headers to .htaccess**

```apache
# public/.htaccess - ADD Security Headers

# Security Headers
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "DENY"
    Header set X-XSS-Protection "1; mode=block"
    Header set Referrer-Policy "strict-origin-when-cross-origin"
    Header set Permissions-Policy "geolocation=(), microphone=(), camera=()"
    Header unset X-Powered-By
</IfModule>

# Prevent clickjacking
<IfModule mod_headers.c>
    Header always set X-Frame-Options "SAMEORIGIN"
</IfModule>

# HSTS (HTTP Strict Transport Security)
<IfModule mod_headers.c>
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
</IfModule>
```

- [ ] **Step 3: Configure CSP for React frontend**

```php
// app/Config/ContentSecurityPolicy.php - MODIFIED for React SPA
public bool $upgradeInsecureRequests = true;

public array $scriptSrcElem = [
    'self',
    'unsafe-inline', // Required for React/Vite in development
];

public array $connectSrc = [
    'self',
    'https://your-production-domain.com',
];

public array $styleSrcElem = [
    'self',
    'unsafe-inline', // Required for inline styles in component libraries
];
```

---

## Tahap 3: Performance Audit (Shared Hosting)

### Task 7: Database Performance Optimization

**Files:**
- Create: `app/Database/Migrations/2026-06-05-AddIndexes.php`
- Modify: `app/Models/SurveiModel.php`

**Current Issues Found:**
- No indexes on survei table (slows down date range queries)
- N+1 query pattern in getRekapByDateRange (mitigated but could be better)
- Session stored in files (ok for shared hosting)

**Audit Steps:**

- [ ] **Step 1: Create migration for database indexes**

```php
// app/Database/Migrations/2026-06-05-AddIndexes.php
<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddIndexes extends Migration
{
    public function up(): void
    {
        // Add index on created_at for date range queries
        $this->forge->addKey('created_at', false, false, 'idx_survei_created_at');

        // Add index on petugas_id for join performance
        $this->forge->addKey('petugas_id', false, false, 'idx_survei_petugas_id');

        // Add composite index for common query pattern
        $this->forge->addKey(['petugas_id', 'created_at'], false, false, 'idx_survei_petugas_date');

        // Add foreign key constraint (if supported by MySQL version)
        $this->forge->addForeignKey('petugas_id', 'petugas', 'id', 'RESTRICT', 'CASCADE');
    }

    public function down(): void
    {
        $this->forge->dropKey('survei', 'idx_survei_created_at');
        $this->forge->dropKey('survei', 'idx_survei_petugas_id');
        $this->forge->dropKey('survei', 'idx_survei_petugas_date');
        $this->forge->dropForeignKey('survei', 'survei_petugas_id_foreign');
    }
}
```

- [ ] **Step 2: Add query result caching**

```php
// app/Models/SurveiModel.php - Add caching for expensive queries

public function getRekapByDateRangeCached(string $start, string $end, int $ttl = 300): array
{
    $cacheKey = "rekap_{$start}_{$end}";

    if ($cached = cache($cacheKey)) {
        return $cached;
    }

    $result = $this->getRekapByDateRange($start, $end);
    cache()->save($cacheKey, $result, $ttl); // Cache for 5 minutes

    return $result;
}
```

- [ ] **Step 3: Run migration and commit**

Run: `php spark migrate`
Commit: `git add -A && git commit -m "perf: add database indexes and query caching"`

---

### Task 8: Frontend Performance Optimization (React/Vite)

**Files:**
- Modify: `frontend/vite.config.ts`
- Create: `frontend/vite.config.perf.ts` (production build config)
- Modify: `frontend/package.json`

**Audit Steps:**

- [ ] **Step 1: Update Vite config for production optimization**

```typescript
// frontend/vite.config.ts - PRODUCTION CONFIG
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,    // Remove console.log in production
        drop_debugger: true,
      },
    },

    // Enable CSS code splitting
    cssCodeSplit: true,

    // Chunk size warnings (in KB)
    chunkSizeWarningLimit: 500,

    // Generate sourcemaps for debugging (disable in production for performance)
    sourcemap: false,

    // Rollup options for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          ui: ['@radix-ui/react-icons', 'lucide-react'],
        },
      },
    },

    // Enable gzip/brotli compression (handled by server, but vite helps)
    assetsInlineLimit: 4096, // Inline assets < 4KB
  },

  // Enable path aliases
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // Optimize deps
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
})
```

- [ ] **Step 2: Add lazy loading to React components**

```typescript
// Example: Lazy load heavy components
const Dashboard = lazy(() => import('./pages/Dashboard'))
const RekapPage = lazy(() => import('./pages/RekapPage'))

// Wrap with Suspense for loading state
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/rekap" element={<RekapPage />} />
  </Routes>
</Suspense>
```

- [ ] **Step 3: Add production build script**

```json
// frontend/package.json - ADD
{
  "scripts": {
    "build:prod": "vite build --mode production",
    "preview:prod": "vite preview --outDir ../public/app"
  }
}
```

---

## Tahap 4: Configuration & Environment Hardening

### Task 9: Production Environment Configuration

**Files:**
- Create: `.env` (from env template)
- Modify: `app/Config/App.php`
- Modify: `app/Config/Logger.php`
- Modify: `app/Config/Exceptions.php`

**Audit Steps:**

- [ ] **Step 1: Create production .env file with secure defaults**

```env
# =============================================================================
# PRODUCTION ENVIRONMENT CONFIGURATION
# =============================================================================

CI_ENVIRONMENT = production

# =============================================================================
# APPLICATION
# =============================================================================

app.baseURL = 'https://your-domain.com'
app.forceGlobalSecureRequests = true
app.CSPEnabled = true
app.appTimezone = 'Asia/Jakarta'
app.indexPage = 'index.php'

# =============================================================================
# DATABASE
# =============================================================================

database.default.hostname = localhost
database.default.database = survey_petugas_prod
database.default.username = prod_db_user
database.default.password = <strong-password-here>
database.default.DBDriver = MySQLi
database.default.charSet = utf8mb4
database.default.DBCollat = utf8mb4_general_ci
database.default.DBDebug = false

# =============================================================================
# ENCRYPTION
# =============================================================================

encryption.key = <generate-64-char-hex-with-openssl-rand-hex-32>
encryption.driver = Sodium
encryption.cipher = AES-256-CTR

# =============================================================================
# JWT AUTHENTICATION
# =============================================================================

JWT_SECRET_KEY = <generate-64-char-random-string-with-openssl-rand-hex-64>
JWT_EXPIRY = 3600

# =============================================================================
# SESSION
# =============================================================================

session.driver = 'CodeIgniter\Session\Handlers\FileHandler'
session.savePath = WRITEPATH . 'session'
session.expiration = 7200
session.matchIP = false
session.cookieName = 'ci_session_prod'
session.sameSite = 'Strict'

# =============================================================================
# CORS (Production)
# =============================================================================

CORS_ALLOWED_ORIGINS = https://your-domain.com

# =============================================================================
# LOGGING
# =============================================================================

logger.threshold = 9
logger.loggable = [
    'emergency',
    'alert',
    'critical',
    'error',
    'warning',
    'info',
    'debug'
]

# =============================================================================
# SECURITY
# =============================================================================

security.tokenRandomize = true
security.tokenName = ci_csrf_token
security.cookieName = csrf_cookie_prod
```

- [ ] **Step 2: Configure production error handling**

```php
// app/Config/Exceptions.php - MODIFIED
public bool $displayError = false;
public bool $logError = true;
public int $logThreshold = 9;

// Custom error handler for production
public function handler(int $severity, string $message, ?string $file = null, ?int $line = null): void
{
    if ($this->shouldIgnore($severity)) {
        return;
    }

    // Log error but don't expose details to users
    log_message('error', "{message} in {file} on line {line}", [
        'message' => $message,
        'file' => $file,
        'line' => $line,
    ]);

    if (ENVIRONMENT === 'production') {
        // Show generic error page
        http_response_code(500);
        echo json_encode([
            'status' => 500,
            'error' => 'Terjadi kesalahan pada server. Silakan coba lagi nanti.'
        ]);
        exit;
    }

    throw new \ErrorException($message, 0, $severity, $file, $line);
}
```

- [ ] **Step 3: Commit configuration changes**

Commit: `git add -A && git commit -m "config: production environment with secure defaults"`

---

## Tahap 5: Deployment Checklist & Security Verification

### Task 10: Shared Hosting Security Checklist

**Files:**
- Create: `docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md`
- Modify: `public/.htaccess`

**Audit Steps:**

- [ ] **Step 1: Create comprehensive deployment checklist**

```markdown
# Production Deployment Checklist

## Pre-Deployment Security Audit

### Backend (CodeIgniter 4)

- [ ] Environment variables configured in `.env` (not committed to git)
- [ ] `CI_ENVIRONMENT = production`
- [ ] `app.forceGlobalSecureRequests = true`
- [ ] CSRF protection enabled
- [ ] JWT secret key is strong (64+ characters)
- [ ] Encryption key configured (AES-256)
- [ ] Database debug mode OFF (`DBDebug = false`)
- [ ] Error display OFF in production
- [ ] Logging configured for errors only
- [ ] HTTPS forced globally

### Database Security

- [ ] Strong database password
- [ ] Database user has minimal permissions (no DROP, no FILE)
- [ ] Indexes created on survei table
- [ ] Foreign key constraints added
- [ ] Regular backup schedule configured

### File Upload Security

- [ ] MIME type validation implemented
- [ ] Image dimension validation (prevent polyglot attacks)
- [ ] Random filename generation
- [ ] Uploads directory .htaccess protection
- [ ] File size limits enforced

### Frontend (React/Vite)

- [ ] Production build generated
- [ ] Console.log statements removed (terser)
- [ ] Source maps disabled for production
- [ ] Lazy loading implemented for heavy components
- [ ] Assets properly chunked

### Server Configuration

- [ ] .htaccess security headers configured
- [ ] Directory listing disabled
- [ ] PHP version 8.2+ verified
- [ ] Required PHP extensions enabled (intl, mbstring, json)
- [ ] SSL/TLS certificate installed
- [ ] HSTS header configured
- [ ] CORS configured for production domain only

### Shared Hosting Specific

- [ ] PHP memory limit adequate (>256M)
- [ ] PHP max execution time adequate (>60s for exports)
- [ ] File upload size limits configured
- [ ] Session garbage collection configured
- [ ] Cache directory writable
- [ ] Log directory writable

## Deployment Steps

1. **Local Testing**
   ```bash
   php spark test                    # Run all tests
   php spark migrate                 # Run migrations
   php spark db:seed                 # Seed required data
   cd frontend && npm run build     # Build production frontend
   ```

2. **Database Migration**
   ```bash
   php spark migrate                 # Add indexes
   ```

3. **File Deployment**
   - Upload all files EXCEPT:
     - `vendor/` (can be uploaded if needed)
     - `node_modules/`
     - `.env` (create fresh on server)
     - Any development files

4. **Server Configuration**
   - Set file permissions: 644 for files, 755 for directories
   - Set ownership to web server user
   - Configure SSL certificate
   - Update .htaccess for production domain

5. **Environment Setup on Server**
   - Create `.env` with production values
   - Generate secure encryption key
   - Generate secure JWT secret
   - Configure production database connection

6. **Post-Deployment Verification**
   - Test login flow
   - Test survei submission
   - Test file upload
   - Check browser console for errors
   - Verify HTTPS is enforced
   - Check security headers with curl:
     ```bash
     curl -I https://your-domain.com
     ```
```

- [ ] **Step 2: Add additional .htaccess security rules**

```apache
# public/.htaccess - ADDITIONAL SECURITY

# Prevent access to sensitive files
<FilesMatch "^\.">
    Order allow,deny
    Deny from all
</FilesMatch>

# Prevent access to backup files
<FilesMatch "\.(bak|conf|dist|fla|in[ci]|log|psd|sh|sql|sw[op])$">
    Order allow,deny
    Deny from all
</FilesMatch>

# Prevent PHP execution in writable directories
<Directory "writable">
    <FilesMatch "\.php$">
        Order Deny,Allow
        Deny from all
    </FilesMatch>
</Directory>

# Limit file upload size (10MB)
LimitRequestBody 10485760

# Prevent server signature disclosure
ServerSignature Off
```

---

## Summary of Tasks

| Task | Area | Priority |
|------|------|----------|
| 1. JWT Security Hardening | Security | Critical |
| 2. CSRF & Rate Limiting | Security | Critical |
| 3. SQL Injection & XSS Prevention | Security | Critical |
| 4. File Upload Security | Security | High |
| 5. Database Encryption | Encryption | High |
| 6. HTTPS & Security Headers | Security | High |
| 7. Database Performance | Performance | High |
| 8. Frontend Optimization | Performance | Medium |
| 9. Production Config | Configuration | Critical |
| 10. Deployment Checklist | Deployment | High |

---

## Verification Commands

```bash
# Security checks
php spark security:check                    # Run security audit
php spark test                              # Run all tests

# Performance checks
php spark db:seed DatabaseSeeder           # If needed
mysql -e "SHOW INDEX FROM survei"          # Verify indexes

# Deployment verification
curl -I https://your-domain.com            # Check headers
openssl s_client -connect your-domain.com:443 -servername your-domain.com | openssl x509 -noout -dates  # Check SSL
```

---

**Estimated Implementation Time:** 4-6 hours
**Estimated Testing Time:** 1-2 hours
**Total:** 5-8 hours for complete production readiness