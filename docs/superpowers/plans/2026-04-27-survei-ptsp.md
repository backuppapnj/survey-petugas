# Survei Kepuasan Masyarakat PTSP — Implementation Plan (Revisi)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **TDD adalah wajib** — setiap task implementasi mengikuti RED → GREEN → REFACTOR.

**Goal:** Membangun aplikasi survei kepuasan masyarakat terhadap petugas PTSP dengan CI4 API backend + React frontend (shadcn/ui + Magic UI), dengan testing menyeluruh.

**Architecture:** Monorepo — CI4 di root sebagai REST API, React app di `frontend/` dengan Vite + TypeScript. JWT auth untuk endpoint admin. Database MySQL dengan 3 tabel (petugas, survei, admin). Backend tests via PHPUnit, frontend tests via Vitest + React Testing Library.

**Tech Stack:** CodeIgniter 4, PHPUnit, React 19, TypeScript, Vite, Vitest, React Testing Library, shadcn/ui, Magic UI, Recharts, MySQL, JWT (firebase/php-jwt), PhpSpreadsheet, qrcode.react

**Konvensi Penting:**
- Bahasa default untuk komentar kode dan pesan error user-facing: **Bahasa Indonesia**
- Identifier (variabel/fungsi/class): **English**
- Setiap task ditutup dengan commit yang menyertakan test + implementation
- Method spoofing dipakai untuk PUT+multipart (POST + `_method=PUT`)

---

## Phase 1: Setup & Database Foundation (Task 1-3)

### Task 1: Environment Setup & Baseline Verification

**Files:**
- Modify: `composer.json` (auto via composer require)
- Create/Edit: `.env`
- Modify: `.gitignore`

- [ ] **Step 1: Install backend Composer dependencies**

```bash
cd /home/moohard/dev/project/survey-petugas
composer require firebase/php-jwt:^6.10
composer require phpoffice/phpspreadsheet:^2.0
composer require ramsey/uuid:^4.7
```

Expected output: `Generating optimized autoload files` di akhir.

- [ ] **Step 2: Buat/sinkronkan `.env` (idempotent)**

```bash
[ -f .env ] || cp env .env
```

Edit `.env` — pastikan baris berikut aktif (uncomment dan set value):

```ini
CI_ENVIRONMENT = development
app.baseURL = 'http://localhost:8080/'
app.appTimezone = 'Asia/Jakarta'
database.default.hostname = localhost
database.default.database = survei_ptsp
database.default.username = root
database.default.password =
database.default.DBDriver = MySQLi
database.default.port = 3306
JWT_SECRET_KEY = survei-ptsp-secret-key-2026
```

> **Penting timezone:** `app.appTimezone = 'Asia/Jakarta'` membuat `date()` PHP dan query MySQL `DATE()` konsisten untuk filter rekap harian. Tanpa ini, test rekap bisa flake di edge midnight UTC.

- [ ] **Step 3: Tambahkan ignore patterns ke `.gitignore`**

Append baris berikut ke akhir `.gitignore`:

```
#-------------------------
# Project Specific
#-------------------------
.superpowers/
frontend/node_modules/
frontend/dist/
public/app/
```

- [ ] **Step 4: Buat database MySQL**

```bash
mysql -u root -e "CREATE DATABASE IF NOT EXISTS survei_ptsp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

- [ ] **Step 5: Verifikasi baseline PHPUnit hijau**

```bash
vendor/bin/phpunit --testdox 2>&1 | tail -20
```

Expected: `OK` atau "No tests executed" — yang penting tidak ada error fatal. Jika ada test yang gagal di baseline, hentikan dan lapor.

- [ ] **Step 6: Verifikasi CI4 berjalan**

```bash
php spark serve > /tmp/ci4-serve.log 2>&1 &
SERVE_PID=$!
sleep 2
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080
kill $SERVE_PID 2>/dev/null
```

Expected: `200`

- [ ] **Step 7: Commit**

```bash
git add composer.json composer.lock .gitignore
git commit -m "chore: install JWT, PhpSpreadsheet, UUID dependencies dan setup gitignore"
```

> Catatan: `.env` tidak di-commit (sudah di `.gitignore` default).

---

### Task 2: Database Migrations dengan TDD

**Files:**
- Create: `app/Database/Migrations/2026-04-27-000001_CreatePetugasTable.php`
- Create: `app/Database/Migrations/2026-04-27-000002_CreateSurveiTable.php`
- Create: `app/Database/Migrations/2026-04-27-000003_CreateAdminTable.php`
- Create: `tests/Database/MigrationTest.php`

- [ ] **Step 1: Tulis test migrasi (RED)**

Create `tests/Database/MigrationTest.php`:

```php
<?php

namespace Tests\Database;

use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;

/**
 * @internal
 */
final class MigrationTest extends CIUnitTestCase
{
    use DatabaseTestTrait;

    protected $migrate     = true;
    protected $migrateOnce = false;
    protected $refresh     = true;
    protected $namespace   = 'App';

    public function testTabelPetugasMemilikiSemuaKolomYangDiperlukan(): void
    {
        $fields = $this->db->getFieldData('petugas');
        $names  = array_column($fields, 'name');

        $this->assertEqualsCanonicalizing(
            ['id', 'nama', 'foto', 'loket', 'unit_kerja', 'is_active', 'created_at', 'updated_at'],
            $names,
        );
    }

    public function testTabelSurveiMemilikiForeignKeyKePetugas(): void
    {
        $fields = $this->db->getFieldData('survei');
        $names  = array_column($fields, 'name');

        $this->assertContains('petugas_id', $names);
        $this->assertContains('kecepatan', $names);
        $this->assertContains('keramahan', $names);
        $this->assertContains('informasi', $names);
        $this->assertContains('kenyamanan', $names);
        $this->assertContains('saran', $names);
        $this->assertContains('created_at', $names);
    }

    public function testTabelAdminMemilikiSemuaKolomYangDiperlukan(): void
    {
        $fields = $this->db->getFieldData('admin');
        $names  = array_column($fields, 'name');

        $this->assertEqualsCanonicalizing(
            ['id', 'username', 'password_hash', 'nama', 'created_at'],
            $names,
        );
    }

    public function testTabelAdminUsernameUnique(): void
    {
        // Verifikasi UNIQUE index pada kolom username
        $indexes = $this->db->query('SHOW INDEX FROM admin WHERE Key_name = "username"')->getResultArray();

        $this->assertNotEmpty($indexes, 'Index unique pada kolom username tidak ditemukan');
        $this->assertSame(0, (int) $indexes[0]['Non_unique'], 'Kolom username harus UNIQUE');
    }
}
```

- [ ] **Step 2: Jalankan test, verifikasi RED**

```bash
vendor/bin/phpunit tests/Database/MigrationTest.php 2>&1 | tail -10
```

Expected: FAIL — migration files belum ada.

- [ ] **Step 3: Buat migration tabel `petugas`**

Create `app/Database/Migrations/2026-04-27-000001_CreatePetugasTable.php`:

```php
<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreatePetugasTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id'         => ['type' => 'INT', 'unsigned' => true, 'auto_increment' => true],
            'nama'       => ['type' => 'VARCHAR', 'constraint' => 100],
            'foto'       => ['type' => 'VARCHAR', 'constraint' => 255],
            'loket'      => ['type' => 'VARCHAR', 'constraint' => 50],
            'unit_kerja' => ['type' => 'VARCHAR', 'constraint' => 100],
            'is_active'  => ['type' => 'TINYINT', 'constraint' => 1, 'default' => 1],
            'created_at' => ['type' => 'DATETIME', 'null' => false],
            'updated_at' => ['type' => 'DATETIME', 'null' => false],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->createTable('petugas');
    }

    public function down()
    {
        $this->forge->dropTable('petugas');
    }
}
```

- [ ] **Step 4: Buat migration tabel `survei`**

Create `app/Database/Migrations/2026-04-27-000002_CreateSurveiTable.php`:

```php
<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateSurveiTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id'         => ['type' => 'INT', 'unsigned' => true, 'auto_increment' => true],
            'petugas_id' => ['type' => 'INT', 'unsigned' => true],
            'kecepatan'  => ['type' => 'TINYINT', 'unsigned' => true],
            'keramahan'  => ['type' => 'TINYINT', 'unsigned' => true],
            'informasi'  => ['type' => 'TINYINT', 'unsigned' => true],
            'kenyamanan' => ['type' => 'TINYINT', 'unsigned' => true],
            'saran'      => ['type' => 'TEXT', 'null' => true],
            'created_at' => ['type' => 'DATETIME', 'null' => false],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addKey('petugas_id');
        $this->forge->addKey('created_at');
        $this->forge->addForeignKey('petugas_id', 'petugas', 'id', 'CASCADE', 'RESTRICT');
        $this->forge->createTable('survei');
    }

    public function down()
    {
        $this->forge->dropTable('survei');
    }
}
```

- [ ] **Step 5: Buat migration tabel `admin`**

Create `app/Database/Migrations/2026-04-27-000003_CreateAdminTable.php`:

```php
<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateAdminTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id'            => ['type' => 'INT', 'unsigned' => true, 'auto_increment' => true],
            'username'      => ['type' => 'VARCHAR', 'constraint' => 50],
            'password_hash' => ['type' => 'VARCHAR', 'constraint' => 255],
            'nama'          => ['type' => 'VARCHAR', 'constraint' => 100],
            'created_at'    => ['type' => 'DATETIME', 'null' => false],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addUniqueKey('username');
        $this->forge->createTable('admin');
    }

    public function down()
    {
        $this->forge->dropTable('admin');
    }
}
```

- [ ] **Step 6: Jalankan test, verifikasi GREEN**

```bash
vendor/bin/phpunit tests/Database/MigrationTest.php 2>&1 | tail -10
```

Expected: `OK (4 tests, ...)`.

- [ ] **Step 7: Jalankan migration di environment dev**

```bash
php spark migrate
```

Expected: `Done. 3 migration(s) have been applied.`

- [ ] **Step 8: Commit**

```bash
git add app/Database/Migrations/ tests/Database/MigrationTest.php
git commit -m "feat: add database migrations for petugas, survei, admin tables with tests"
```

---

### Task 3: Database Seeders dengan TDD

**Files:**
- Create: `app/Database/Seeds/AdminSeeder.php`
- Create: `app/Database/Seeds/PetugasSeeder.php`
- Create: `app/Database/Seeds/DatabaseSeeder.php`
- Create: `tests/Database/SeederTest.php`

- [ ] **Step 1: Tulis test seeder (RED)**

Create `tests/Database/SeederTest.php`:

```php
<?php

namespace Tests\Database;

use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;

/**
 * @internal
 */
final class SeederTest extends CIUnitTestCase
{
    use DatabaseTestTrait;

    protected $migrate     = true;
    protected $refresh     = true;
    protected $seed        = 'App\Database\Seeds\DatabaseSeeder';
    protected $namespace   = 'App';

    public function testAdminSeederMembuatAkunDefault(): void
    {
        $admin = $this->db->table('admin')->where('username', 'admin')->get()->getRowArray();

        $this->assertNotNull($admin);
        $this->assertSame('Administrator', $admin['nama']);
        $this->assertTrue(password_verify('admin123', $admin['password_hash']));
    }

    public function testPetugasSeederMembuatTigaPetugasAktif(): void
    {
        $count = $this->db->table('petugas')->where('is_active', 1)->countAllResults();

        $this->assertSame(3, $count);
    }
}
```

- [ ] **Step 2: Jalankan test, verifikasi RED**

```bash
vendor/bin/phpunit tests/Database/SeederTest.php 2>&1 | tail -10
```

Expected: FAIL — seeder belum ada.

- [ ] **Step 3: Buat AdminSeeder**

Create `app/Database/Seeds/AdminSeeder.php`:

```php
<?php

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

class AdminSeeder extends Seeder
{
    public function run()
    {
        $this->db->table('admin')->insert([
            'username'      => 'admin',
            'password_hash' => password_hash('admin123', PASSWORD_BCRYPT),
            'nama'          => 'Administrator',
            'created_at'    => date('Y-m-d H:i:s'),
        ]);
    }
}
```

- [ ] **Step 4: Buat PetugasSeeder**

Create `app/Database/Seeds/PetugasSeeder.php`:

```php
<?php

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

class PetugasSeeder extends Seeder
{
    public function run()
    {
        $now  = date('Y-m-d H:i:s');
        $data = [
            ['nama' => 'Budi Santoso',   'foto' => 'placeholder-1.png', 'loket' => 'Loket 1', 'unit_kerja' => 'Pelayanan Umum', 'is_active' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['nama' => 'Siti Nurhaliza', 'foto' => 'placeholder-2.png', 'loket' => 'Loket 2', 'unit_kerja' => 'Perizinan',      'is_active' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['nama' => 'Ahmad Fauzi',    'foto' => 'placeholder-3.png', 'loket' => 'Loket 3', 'unit_kerja' => 'Informasi',      'is_active' => 1, 'created_at' => $now, 'updated_at' => $now],
        ];
        $this->db->table('petugas')->insertBatch($data);
    }
}
```

- [ ] **Step 5: Buat DatabaseSeeder**

Create `app/Database/Seeds/DatabaseSeeder.php`:

```php
<?php

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run()
    {
        $this->call('AdminSeeder');
        $this->call('PetugasSeeder');
    }
}
```

- [ ] **Step 6: Jalankan test, verifikasi GREEN**

```bash
vendor/bin/phpunit tests/Database/SeederTest.php 2>&1 | tail -10
```

Expected: `OK (2 tests, ...)`.

- [ ] **Step 7: Jalankan seeder di environment dev**

```bash
php spark db:seed DatabaseSeeder
```

- [ ] **Step 8: Commit**

```bash
git add app/Database/Seeds/ tests/Database/SeederTest.php
git commit -m "feat: add database seeders for admin and petugas with tests"
```

---

## Phase 2: Models, JWT & Auth (Task 4-6)

### Task 4: Models dengan TDD (Admin, Petugas, Survei)

**Files:**
- Create: `app/Models/AdminModel.php`
- Create: `app/Models/PetugasModel.php`
- Create: `app/Models/SurveiModel.php`
- Create: `tests/Models/AdminModelTest.php`
- Create: `tests/Models/PetugasModelTest.php`
- Create: `tests/Models/SurveiModelTest.php`

- [ ] **Step 1: Tulis test AdminModel (RED)**

Create `tests/Models/AdminModelTest.php`:

```php
<?php

namespace Tests\Models;

use App\Models\AdminModel;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;

/**
 * @internal
 */
final class AdminModelTest extends CIUnitTestCase
{
    use DatabaseTestTrait;

    protected $migrate   = true;
    protected $refresh   = true;
    protected $seed      = 'App\Database\Seeds\DatabaseSeeder';
    protected $namespace = 'App';

    public function testFindByUsernameMengembalikanAdmin(): void
    {
        $model = new AdminModel();
        $admin = $model->findByUsername('admin');

        $this->assertNotNull($admin);
        $this->assertSame('admin', $admin['username']);
    }

    public function testFindByUsernameMengembalikanNullJikaTidakAda(): void
    {
        $model = new AdminModel();

        $this->assertNull($model->findByUsername('tidak-ada'));
    }
}
```

- [ ] **Step 2: Tulis test PetugasModel (RED)**

Create `tests/Models/PetugasModelTest.php`:

```php
<?php

namespace Tests\Models;

use App\Models\PetugasModel;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;

/**
 * @internal
 */
final class PetugasModelTest extends CIUnitTestCase
{
    use DatabaseTestTrait;

    protected $migrate   = true;
    protected $refresh   = true;
    protected $seed      = 'App\Database\Seeds\DatabaseSeeder';
    protected $namespace = 'App';

    public function testGetActiveHanyaMengembalikanPetugasAktif(): void
    {
        $model = new PetugasModel();

        // Nonaktifkan satu petugas
        $model->update(1, ['is_active' => 0]);

        $aktif = $model->getActive();

        $this->assertCount(2, $aktif);
        foreach ($aktif as $p) {
            $this->assertSame(1, (int) $p['is_active']);
        }
    }

    public function testGetActiveDetailMengembalikanNullJikaPetugasNonAktif(): void
    {
        $model = new PetugasModel();
        $model->update(1, ['is_active' => 0]);

        $this->assertNull($model->getActiveDetail(1));
        $this->assertNotNull($model->getActiveDetail(2));
    }
}
```

- [ ] **Step 3: Tulis test SurveiModel (RED)**

Create `tests/Models/SurveiModelTest.php`:

```php
<?php

namespace Tests\Models;

use App\Models\SurveiModel;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;

/**
 * @internal
 */
final class SurveiModelTest extends CIUnitTestCase
{
    use DatabaseTestTrait;

    protected $migrate   = true;
    protected $refresh   = true;
    protected $seed      = 'App\Database\Seeds\DatabaseSeeder';
    protected $namespace = 'App';

    public function testGetRekapByDateRangeKembalikanStrukturKosongJikaTidakAdaData(): void
    {
        $model = new SurveiModel();
        $today = date('Y-m-d');
        $rekap = $model->getRekapByDateRange($today, $today);

        $this->assertSame(0, $rekap['summary']['total_responden']);
        $this->assertSame(0.0, (float) $rekap['summary']['ikm']);
        $this->assertSame([], $rekap['per_petugas']);
        $this->assertSame([], $rekap['semua']);
    }

    public function testGetRekapByDateRangeMenghitungIKMDenganBenar(): void
    {
        $model = new SurveiModel();
        $now   = date('Y-m-d H:i:s');

        // Insert 2 survei untuk petugas 1, semua bintang 5 → IKM 100
        $model->insert(['petugas_id' => 1, 'kecepatan' => 5, 'keramahan' => 5, 'informasi' => 5, 'kenyamanan' => 5, 'saran' => null]);
        $model->insert(['petugas_id' => 1, 'kecepatan' => 5, 'keramahan' => 5, 'informasi' => 5, 'kenyamanan' => 5, 'saran' => null]);

        $today = date('Y-m-d');
        $rekap = $model->getRekapByDateRange($today, $today);

        $this->assertSame(2, $rekap['summary']['total_responden']);
        $this->assertSame(100.0, (float) $rekap['summary']['ikm']);
        $this->assertCount(1, $rekap['per_petugas']);
        $this->assertSame('Budi Santoso', $rekap['per_petugas'][0]['nama']);
        $this->assertSame(2, $rekap['per_petugas'][0]['total_responden']);
    }

    public function testGetRekapByDateRangeMenghitungRataRataPerPetugas(): void
    {
        $model = new SurveiModel();

        // Petugas 1: bintang 4 untuk semua aspek
        $model->insert(['petugas_id' => 1, 'kecepatan' => 4, 'keramahan' => 4, 'informasi' => 4, 'kenyamanan' => 4]);
        // Petugas 2: bintang 5 untuk semua aspek
        $model->insert(['petugas_id' => 2, 'kecepatan' => 5, 'keramahan' => 5, 'informasi' => 5, 'kenyamanan' => 5]);

        $today = date('Y-m-d');
        $rekap = $model->getRekapByDateRange($today, $today);

        $this->assertSame(2, $rekap['summary']['total_responden']);
        // Rata-rata: ((4+5)/2 + (4+5)/2 + (4+5)/2 + (4+5)/2) / 4 = 4.5; IKM = 4.5/5 * 100 = 90
        $this->assertSame(90.0, (float) $rekap['summary']['ikm']);
    }
}
```

- [ ] **Step 4: Jalankan tests, verifikasi RED**

```bash
vendor/bin/phpunit tests/Models/ 2>&1 | tail -15
```

Expected: FAIL — model belum ada.

- [ ] **Step 5: Implement AdminModel**

Create `app/Models/AdminModel.php`:

```php
<?php

namespace App\Models;

use CodeIgniter\Model;

class AdminModel extends Model
{
    protected $table         = 'admin';
    protected $primaryKey    = 'id';
    protected $allowedFields = ['username', 'password_hash', 'nama', 'created_at'];
    protected $returnType    = 'array';
    protected $useTimestamps = false;

    public function findByUsername(string $username): ?array
    {
        return $this->where('username', $username)->first();
    }
}
```

- [ ] **Step 6: Implement PetugasModel**

Create `app/Models/PetugasModel.php`:

```php
<?php

namespace App\Models;

use CodeIgniter\Model;

class PetugasModel extends Model
{
    protected $table         = 'petugas';
    protected $primaryKey    = 'id';
    protected $allowedFields = ['nama', 'foto', 'loket', 'unit_kerja', 'is_active'];
    protected $returnType    = 'array';
    protected $useTimestamps = true;
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';

    public function getActive(): array
    {
        return $this->where('is_active', 1)->findAll();
    }

    public function getActiveDetail(int $id): ?array
    {
        return $this->where('is_active', 1)->find($id);
    }
}
```

- [ ] **Step 7: Implement SurveiModel (dengan fix N+1 query)**

Create `app/Models/SurveiModel.php`:

```php
<?php

namespace App\Models;

use CodeIgniter\Model;

class SurveiModel extends Model
{
    protected $table         = 'survei';
    protected $primaryKey    = 'id';
    protected $allowedFields = ['petugas_id', 'kecepatan', 'keramahan', 'informasi', 'kenyamanan', 'saran'];
    protected $returnType    = 'array';
    protected $useTimestamps = false; // hanya created_at, di-set manual saat insert

    /**
     * Override insert untuk set created_at otomatis.
     */
    protected function setCreatedAt(array $data): array
    {
        if (! isset($data['data']['created_at'])) {
            $data['data']['created_at'] = date('Y-m-d H:i:s');
        }
        return $data;
    }

    protected $beforeInsert = ['setCreatedAt'];

    /**
     * Hitung rekap survei dalam rentang tanggal.
     * Mengembalikan ringkasan, agregat per petugas, dan data mentah.
     */
    public function getRekapByDateRange(string $start, string $end): array
    {
        $semua = $this->where('DATE(created_at) >=', $start)
            ->where('DATE(created_at) <=', $end)
            ->orderBy('created_at', 'DESC')
            ->findAll();

        $totalResponden = count($semua);
        $rataRata       = ['kecepatan' => 0.0, 'keramahan' => 0.0, 'informasi' => 0.0, 'kenyamanan' => 0.0];
        $perPetugas     = [];

        if ($totalResponden === 0) {
            return [
                'summary'     => ['total_responden' => 0, 'rata_rata' => $rataRata, 'ikm' => 0.0],
                'per_petugas' => [],
                'semua'       => [],
            ];
        }

        // Hitung rata-rata global
        foreach ($semua as $s) {
            $rataRata['kecepatan']  += (int) $s['kecepatan'];
            $rataRata['keramahan']  += (int) $s['keramahan'];
            $rataRata['informasi']  += (int) $s['informasi'];
            $rataRata['kenyamanan'] += (int) $s['kenyamanan'];
        }
        foreach ($rataRata as $key => $val) {
            $rataRata[$key] = round($val / $totalResponden, 2);
        }

        $rataRataTotal = array_sum($rataRata) / 4;
        $ikm           = round(($rataRataTotal / 5) * 100, 2);

        // Group survei per petugas
        $grouped = [];
        foreach ($semua as $s) {
            $grouped[(int) $s['petugas_id']][] = $s;
        }

        // Single query untuk semua petugas (hindari N+1)
        $petugasIds = array_keys($grouped);
        $petugasMap = [];
        if ($petugasIds !== []) {
            $petugasRows = (new PetugasModel())->whereIn('id', $petugasIds)->findAll();
            foreach ($petugasRows as $p) {
                $petugasMap[(int) $p['id']] = $p;
            }
        }

        foreach ($grouped as $pid => $items) {
            $count = count($items);
            $avg   = ['kecepatan' => 0.0, 'keramahan' => 0.0, 'informasi' => 0.0, 'kenyamanan' => 0.0];
            foreach ($items as $item) {
                $avg['kecepatan']  += (int) $item['kecepatan'];
                $avg['keramahan']  += (int) $item['keramahan'];
                $avg['informasi']  += (int) $item['informasi'];
                $avg['kenyamanan'] += (int) $item['kenyamanan'];
            }
            foreach ($avg as $key => $val) {
                $avg[$key] = round($val / $count, 2);
            }

            $petugas      = $petugasMap[$pid] ?? null;
            $perPetugas[] = [
                'petugas_id'      => $pid,
                'nama'            => $petugas['nama'] ?? 'Unknown',
                'foto_url'        => $petugas ? '/api/uploads/' . $petugas['foto'] : '',
                'total_responden' => $count,
                'rata_rata'       => $avg,
            ];
        }

        return [
            'summary'     => ['total_responden' => $totalResponden, 'rata_rata' => $rataRata, 'ikm' => $ikm],
            'per_petugas' => $perPetugas,
            'semua'       => $semua,
        ];
    }
}
```

- [ ] **Step 8: Jalankan tests, verifikasi GREEN**

```bash
vendor/bin/phpunit tests/Models/ 2>&1 | tail -15
```

Expected: `OK (7 tests, ...)` — semua test lulus.

- [ ] **Step 9: Commit**

```bash
git add app/Models/ tests/Models/
git commit -m "feat: add AdminModel, PetugasModel, SurveiModel dengan TDD"
```

---

### Task 5: JWT Library, Service Registry, dan Filter dengan TDD

**Files:**
- Create: `app/Libraries/JwtLibrary.php`
- Create: `app/Services/JwtAuth.php`
- Modify: `app/Config/Services.php`
- Create: `app/Filters/JwtFilter.php`
- Modify: `app/Config/Filters.php`
- Create: `tests/Libraries/JwtLibraryTest.php`

- [ ] **Step 1: Tulis test JwtLibrary (RED)**

Create `tests/Libraries/JwtLibraryTest.php`:

```php
<?php

namespace Tests\Libraries;

use App\Libraries\JwtLibrary;
use CodeIgniter\Test\CIUnitTestCase;

/**
 * @internal
 */
final class JwtLibraryTest extends CIUnitTestCase
{
    public function testEncodeDanDecodeMengembalikanPayloadAsli(): void
    {
        $jwt     = new JwtLibrary();
        $payload = ['admin_id' => 1, 'username' => 'admin'];

        $token   = $jwt->encode($payload);
        $decoded = $jwt->decode($token);

        $this->assertNotNull($decoded);
        $this->assertSame(1, $decoded->admin_id);
        $this->assertSame('admin', $decoded->username);
    }

    public function testDecodeMengembalikanNullUntukTokenInvalid(): void
    {
        $jwt = new JwtLibrary();

        $this->assertNull($jwt->decode('token-invalid-sekali'));
        $this->assertNull($jwt->decode(''));
    }

    public function testTokenMemilikiClaimIatDanExp(): void
    {
        $jwt   = new JwtLibrary();
        $token = $jwt->encode(['admin_id' => 1]);

        $decoded = $jwt->decode($token);

        $this->assertNotNull($decoded);
        $this->assertGreaterThan(0, $decoded->iat);
        $this->assertGreaterThan($decoded->iat, $decoded->exp);
    }
}
```

- [ ] **Step 2: Jalankan test, verifikasi RED**

```bash
vendor/bin/phpunit tests/Libraries/JwtLibraryTest.php 2>&1 | tail -10
```

Expected: FAIL.

- [ ] **Step 3: Implement JwtLibrary**

Create `app/Libraries/JwtLibrary.php`:

```php
<?php

namespace App\Libraries;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Throwable;

class JwtLibrary
{
    private string $secretKey;
    private string $algorithm = 'HS256';
    private int $expiry       = 86400; // 24 jam

    public function __construct()
    {
        $this->secretKey = (string) env('JWT_SECRET_KEY', 'default-secret-key-change-me');
    }

    public function encode(array $payload): string
    {
        $issuedAt = time();
        $merged   = array_merge($payload, ['iat' => $issuedAt, 'exp' => $issuedAt + $this->expiry]);

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
}
```

- [ ] **Step 4: Buat JwtAuth service registry**

Create `app/Services/JwtAuth.php`:

```php
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
```

- [ ] **Step 5: Daftarkan service di `app/Config/Services.php`**

Tambahkan method berikut di dalam class `Services` (setelah method `__construct` atau pada akhir class):

```php
    public static function jwtAuth(bool $getShared = true): \App\Services\JwtAuth
    {
        if ($getShared) {
            return static::getSharedInstance('jwtAuth');
        }

        return new \App\Services\JwtAuth();
    }
```

- [ ] **Step 6: Implement JwtFilter**

Create `app/Filters/JwtFilter.php`:

```php
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
        $decoded = (new JwtLibrary())->decode($token);

        if ($decoded === null) {
            return service('response')
                ->setStatusCode(401)
                ->setJSON(['status' => 401, 'error' => 'Token tidak valid atau sudah kadaluarsa']);
        }

        // Simpan payload ke service singleton agar bisa diakses controller
        service('jwtAuth')->setPayload($decoded);
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
        // tidak ada operasi setelah response
    }
}
```

- [ ] **Step 7: Daftarkan filter alias di `app/Config/Filters.php`**

Edit array `$aliases` — tambahkan `'jwt' => \App\Filters\JwtFilter::class,` setelah `'performance'`. Hasil akhir:

```php
    public array $aliases = [
        'csrf'          => CSRF::class,
        'toolbar'       => DebugToolbar::class,
        'honeypot'      => Honeypot::class,
        'invalidchars'  => InvalidChars::class,
        'secureheaders' => SecureHeaders::class,
        'cors'          => Cors::class,
        'forcehttps'    => ForceHTTPS::class,
        'pagecache'     => PageCache::class,
        'performance'   => PerformanceMetrics::class,
        'jwt'           => \App\Filters\JwtFilter::class,
    ];
```

- [ ] **Step 8: Jalankan test, verifikasi GREEN**

```bash
vendor/bin/phpunit tests/Libraries/JwtLibraryTest.php 2>&1 | tail -10
```

Expected: `OK (3 tests, ...)`.

- [ ] **Step 9: Commit**

```bash
git add app/Libraries/ app/Services/ app/Filters/ app/Config/Services.php app/Config/Filters.php tests/Libraries/
git commit -m "feat: add JWT library, JwtAuth service singleton, dan JwtFilter dengan tests"
```

---

### Task 6: AuthController dengan TDD

**Files:**
- Create: `app/Controllers/Api/AuthController.php`
- Modify: `app/Config/Routes.php`
- Create: `tests/Controllers/Api/AuthControllerTest.php`

- [ ] **Step 1: Tulis test AuthController (RED)**

Create `tests/Controllers/Api/AuthControllerTest.php`:

```php
<?php

namespace Tests\Controllers\Api;

use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;
use CodeIgniter\Test\FeatureTestTrait;

/**
 * @internal
 */
final class AuthControllerTest extends CIUnitTestCase
{
    use DatabaseTestTrait;
    use FeatureTestTrait;

    protected $migrate   = true;
    protected $refresh   = true;
    protected $seed      = 'App\Database\Seeds\DatabaseSeeder';
    protected $namespace = 'App';

    public function testLoginSuksesMengembalikanToken(): void
    {
        $result = $this->withBodyFormat('json')->call('post', '/api/login', [
            'username' => 'admin',
            'password' => 'admin123',
        ]);

        $result->assertStatus(200);
        $body = json_decode($result->getJSON(), true);

        $this->assertArrayHasKey('token', $body);
        $this->assertNotEmpty($body['token']);
        $this->assertSame('admin', $body['admin']['username']);
    }

    public function testLoginGagalDenganPasswordSalah(): void
    {
        $result = $this->withBodyFormat('json')->call('post', '/api/login', [
            'username' => 'admin',
            'password' => 'password-salah',
        ]);

        $result->assertStatus(401);
    }

    public function testLoginGagalTanpaUsername(): void
    {
        $result = $this->withBodyFormat('json')->call('post', '/api/login', [
            'password' => 'admin123',
        ]);

        $result->assertStatus(422);
    }
}
```

- [ ] **Step 2: Daftarkan route minimal untuk login**

Modify `app/Config/Routes.php` — tambahkan setelah `$routes->get('/', 'Home::index');`:

```php
$routes->group('api', ['namespace' => 'App\Controllers\Api'], static function ($routes) {
    $routes->post('login', 'AuthController::login');
});
```

- [ ] **Step 3: Jalankan test, verifikasi RED**

```bash
vendor/bin/phpunit tests/Controllers/Api/AuthControllerTest.php 2>&1 | tail -10
```

Expected: FAIL — controller belum ada.

- [ ] **Step 4: Implement AuthController**

Create `app/Controllers/Api/AuthController.php`:

```php
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
        $json  = $this->request->getJSON(true) ?? [];
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
```

- [ ] **Step 5: Jalankan test, verifikasi GREEN**

```bash
vendor/bin/phpunit tests/Controllers/Api/AuthControllerTest.php 2>&1 | tail -10
```

Expected: `OK (3 tests, ...)`.

- [ ] **Step 6: Commit**

```bash
git add app/Controllers/Api/AuthController.php app/Config/Routes.php tests/Controllers/Api/AuthControllerTest.php
git commit -m "feat: add AuthController dengan endpoint login + tests"
```

---

## Phase 3: API Controllers (Task 7-10)

### Task 7: PetugasController (Public + Admin CRUD) dengan TDD

**Files:**
- Create: `app/Controllers/Api/PetugasController.php`
- Modify: `app/Config/Routes.php`
- Create: `tests/Controllers/Api/PetugasControllerTest.php`

> **Catatan teknis:** Untuk endpoint UPDATE petugas dengan upload foto, gunakan **HTTP Method Spoofing** CI4 — frontend kirim `POST /api/admin/petugas/{id}` dengan FormData yang berisi `_method=PUT`. CI4 akan memperlakukannya sebagai PUT secara routing. Ini diperlukan karena PHP tidak parse multipart/form-data untuk method PUT.

- [ ] **Step 1: Tulis test PetugasController (RED)**

Create `tests/Controllers/Api/PetugasControllerTest.php`:

```php
<?php

namespace Tests\Controllers\Api;

use App\Libraries\JwtLibrary;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;
use CodeIgniter\Test\FeatureTestTrait;

/**
 * @internal
 */
final class PetugasControllerTest extends CIUnitTestCase
{
    use DatabaseTestTrait;
    use FeatureTestTrait;

    protected $migrate   = true;
    protected $refresh   = true;
    protected $seed      = 'App\Database\Seeds\DatabaseSeeder';
    protected $namespace = 'App';

    private function authHeader(): array
    {
        $token = (new JwtLibrary())->encode(['admin_id' => 1, 'username' => 'admin']);
        return ['Authorization' => 'Bearer ' . $token];
    }

    public function testShowPublicMengembalikanPetugasAktif(): void
    {
        $result = $this->call('get', '/api/petugas/1');

        $result->assertStatus(200);
        $body = json_decode($result->getJSON(), true);
        $this->assertSame('Budi Santoso', $body['nama']);
        $this->assertStringContainsString('/api/uploads/', $body['foto_url']);
    }

    public function testShowPublic404UntukPetugasNonAktif(): void
    {
        $this->db->table('petugas')->where('id', 1)->update(['is_active' => 0]);

        $result = $this->call('get', '/api/petugas/1');

        $result->assertStatus(404);
    }

    public function testIndexAdmin401TanpaToken(): void
    {
        $result = $this->call('get', '/api/admin/petugas');

        $result->assertStatus(401);
    }

    public function testIndexAdminMengembalikanSemuaPetugas(): void
    {
        $result = $this->withHeaders($this->authHeader())->call('get', '/api/admin/petugas');

        $result->assertStatus(200);
        $body = json_decode($result->getJSON(), true);
        $this->assertCount(3, $body);
    }

    public function testDeleteAdminSoftDeletePetugas(): void
    {
        $result = $this->withHeaders($this->authHeader())->call('delete', '/api/admin/petugas/1');

        $result->assertStatus(200);

        $row = $this->db->table('petugas')->where('id', 1)->get()->getRowArray();
        $this->assertSame(0, (int) $row['is_active']);
    }
}
```

- [ ] **Step 2: Daftarkan route placeholder**

Modify `app/Config/Routes.php` — perluas grup `api` menjadi:

```php
$routes->group('api', ['namespace' => 'App\Controllers\Api'], static function ($routes) {
    $routes->post('login', 'AuthController::login');
    $routes->get('petugas/(:num)', 'PetugasController::show/$1');

    $routes->group('admin', ['filter' => 'jwt'], static function ($routes) {
        $routes->get('petugas', 'PetugasController::index');
        $routes->post('petugas', 'PetugasController::create');
        $routes->put('petugas/(:num)', 'PetugasController::update/$1');
        $routes->delete('petugas/(:num)', 'PetugasController::delete/$1');
    });
});
```

- [ ] **Step 3: Jalankan test, verifikasi RED**

```bash
vendor/bin/phpunit tests/Controllers/Api/PetugasControllerTest.php 2>&1 | tail -15
```

Expected: FAIL.

- [ ] **Step 4: Implement PetugasController**

Create `app/Controllers/Api/PetugasController.php`:

```php
<?php

namespace App\Controllers\Api;

use App\Models\PetugasModel;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;
use Ramsey\Uuid\Uuid;

class PetugasController extends ResourceController
{
    protected PetugasModel $petugasModel;

    public function __construct()
    {
        $this->petugasModel = new PetugasModel();
    }

    /**
     * GET /api/petugas/{id} — public, hanya petugas aktif.
     */
    public function show($id = null): ResponseInterface
    {
        $petugas = $this->petugasModel->getActiveDetail((int) $id);

        if ($petugas === null) {
            return $this->response->setStatusCode(404)->setJSON([
                'status' => 404,
                'error'  => 'Petugas tidak ditemukan',
            ]);
        }

        return $this->response->setJSON($this->serialize($petugas));
    }

    /**
     * GET /api/admin/petugas — list semua petugas (termasuk non-aktif).
     */
    public function index(): ResponseInterface
    {
        $petugas = $this->petugasModel->findAll();

        return $this->response->setJSON(array_map(
            fn ($p) => $this->serialize($p, includeStatus: true),
            $petugas,
        ));
    }

    /**
     * POST /api/admin/petugas — buat petugas baru (multipart/form-data).
     */
    public function create(): ResponseInterface
    {
        $rules = [
            'nama'       => 'required|string|max_length[100]',
            'loket'      => 'required|string|max_length[50]',
            'unit_kerja' => 'required|string|max_length[100]',
            'foto'       => 'uploaded[foto]|max_size[foto,2048]|is_image[foto]|mime_in[foto,image/jpeg,image/png]',
        ];

        if (! $this->validate($rules)) {
            return $this->response->setStatusCode(422)->setJSON([
                'status'   => 422,
                'error'    => 'Validation Error',
                'messages' => $this->validator->getErrors(),
            ]);
        }

        $foto     = $this->request->getFile('foto');
        $filename = Uuid::uuid4()->toString() . '.' . $foto->getExtension();
        $foto->move(WRITEPATH . 'uploads', $filename);

        $id = $this->petugasModel->insert([
            'nama'       => (string) $this->request->getPost('nama'),
            'foto'       => $filename,
            'loket'      => (string) $this->request->getPost('loket'),
            'unit_kerja' => (string) $this->request->getPost('unit_kerja'),
        ]);

        return $this->response->setStatusCode(201)->setJSON(
            $this->serialize($this->petugasModel->find($id), includeStatus: true),
        );
    }

    /**
     * PUT /api/admin/petugas/{id} — update petugas (multipart via _method spoofing).
     */
    public function update($id = null): ResponseInterface
    {
        $petugas = $this->petugasModel->find((int) $id);

        if ($petugas === null) {
            return $this->response->setStatusCode(404)->setJSON([
                'status' => 404,
                'error'  => 'Petugas tidak ditemukan',
            ]);
        }

        $data = [];
        foreach (['nama', 'loket', 'unit_kerja'] as $field) {
            $value = $this->request->getPost($field);
            if ($value !== null && $value !== '') {
                $data[$field] = (string) $value;
            }
        }

        $foto = $this->request->getFile('foto');
        if ($foto !== null && $foto->isValid() && ! $foto->hasMoved()) {
            $rules = ['foto' => 'max_size[foto,2048]|is_image[foto]|mime_in[foto,image/jpeg,image/png]'];
            if (! $this->validate($rules)) {
                return $this->response->setStatusCode(422)->setJSON([
                    'status'   => 422,
                    'error'    => 'Validation Error',
                    'messages' => $this->validator->getErrors(),
                ]);
            }
            $filename = Uuid::uuid4()->toString() . '.' . $foto->getExtension();
            $foto->move(WRITEPATH . 'uploads', $filename);
            $data['foto'] = $filename;
        }

        if ($data === []) {
            return $this->response->setStatusCode(422)->setJSON([
                'status' => 422,
                'error'  => 'Tidak ada data yang diubah',
            ]);
        }

        $this->petugasModel->update($id, $data);

        return $this->response->setJSON(
            $this->serialize($this->petugasModel->find($id), includeStatus: true),
        );
    }

    /**
     * DELETE /api/admin/petugas/{id} — soft delete (set is_active=0).
     */
    public function delete($id = null): ResponseInterface
    {
        $petugas = $this->petugasModel->find((int) $id);

        if ($petugas === null) {
            return $this->response->setStatusCode(404)->setJSON([
                'status' => 404,
                'error'  => 'Petugas tidak ditemukan',
            ]);
        }

        $this->petugasModel->update($id, ['is_active' => 0]);

        return $this->response->setJSON(['message' => 'Petugas berhasil dinonaktifkan']);
    }

    /**
     * Helper untuk serialisasi petugas ke format API.
     */
    private function serialize(array $petugas, bool $includeStatus = false): array
    {
        $out = [
            'id'         => (int) $petugas['id'],
            'nama'       => $petugas['nama'],
            'foto_url'   => '/api/uploads/' . $petugas['foto'],
            'loket'      => $petugas['loket'],
            'unit_kerja' => $petugas['unit_kerja'],
        ];
        if ($includeStatus) {
            $out['is_active'] = (int) $petugas['is_active'];
        }
        return $out;
    }
}
```

- [ ] **Step 5: Jalankan test, verifikasi GREEN**

```bash
vendor/bin/phpunit tests/Controllers/Api/PetugasControllerTest.php 2>&1 | tail -15
```

Expected: `OK (5 tests, ...)`.

- [ ] **Step 6: Commit**

```bash
git add app/Controllers/Api/PetugasController.php app/Config/Routes.php tests/Controllers/Api/PetugasControllerTest.php
git commit -m "feat: add PetugasController CRUD dengan tests dan method spoofing untuk PUT+multipart"
```

---

### Task 8: SurveiController + UploadsController dengan TDD

**Files:**
- Create: `app/Controllers/Api/SurveiController.php`
- Create: `app/Controllers/Api/UploadsController.php`
- Modify: `app/Config/Routes.php`
- Create: `tests/Controllers/Api/SurveiControllerTest.php`

- [ ] **Step 1: Tulis test SurveiController (RED)**

Create `tests/Controllers/Api/SurveiControllerTest.php`:

```php
<?php

namespace Tests\Controllers\Api;

use App\Libraries\JwtLibrary;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;
use CodeIgniter\Test\FeatureTestTrait;

/**
 * @internal
 */
final class SurveiControllerTest extends CIUnitTestCase
{
    use DatabaseTestTrait;
    use FeatureTestTrait;

    protected $migrate   = true;
    protected $refresh   = true;
    protected $seed      = 'App\Database\Seeds\DatabaseSeeder';
    protected $namespace = 'App';

    public function testSubmitSuksesDenganRatingValid(): void
    {
        $result = $this->withBodyFormat('json')->call('post', '/api/survei', [
            'petugas_id' => 1,
            'kecepatan'  => 5,
            'keramahan'  => 4,
            'informasi'  => 5,
            'kenyamanan' => 4,
            'saran'      => 'Mantap',
        ]);

        $result->assertStatus(201);

        $count = $this->db->table('survei')->countAllResults();
        $this->assertSame(1, $count);
    }

    public function testSubmitGagalDenganRatingDiluar1Sampai5(): void
    {
        $result = $this->withBodyFormat('json')->call('post', '/api/survei', [
            'petugas_id' => 1,
            'kecepatan'  => 6,
            'keramahan'  => 4,
            'informasi'  => 5,
            'kenyamanan' => 4,
        ]);

        $result->assertStatus(422);
    }

    public function testSubmitGagalUntukPetugasNonAktif(): void
    {
        $this->db->table('petugas')->where('id', 1)->update(['is_active' => 0]);

        $result = $this->withBodyFormat('json')->call('post', '/api/survei', [
            'petugas_id' => 1,
            'kecepatan'  => 5,
            'keramahan'  => 5,
            'informasi'  => 5,
            'kenyamanan' => 5,
        ]);

        $result->assertStatus(422);
    }

    public function testRekapMembutuhkanAuth(): void
    {
        $result = $this->call('get', '/api/admin/survei/rekap');

        $result->assertStatus(401);
    }

    public function testRekapMengembalikanStrukturLengkap(): void
    {
        $token   = (new JwtLibrary())->encode(['admin_id' => 1, 'username' => 'admin']);
        $headers = ['Authorization' => 'Bearer ' . $token];

        $today = date('Y-m-d');
        $result = $this->withHeaders($headers)->call('get', "/api/admin/survei/rekap?start={$today}&end={$today}");

        $result->assertStatus(200);
        $body = json_decode($result->getJSON(), true);
        $this->assertArrayHasKey('summary', $body);
        $this->assertArrayHasKey('per_petugas', $body);
        $this->assertArrayHasKey('semua', $body);
    }
}
```

- [ ] **Step 2: Tambah routes**

Modify `app/Config/Routes.php` — perluas grup `api` menjadi (final state untuk task ini):

```php
$routes->group('api', ['namespace' => 'App\Controllers\Api'], static function ($routes) {
    $routes->post('login', 'AuthController::login');
    $routes->get('petugas/(:num)', 'PetugasController::show/$1');
    $routes->post('survei', 'SurveiController::submit');
    $routes->get('uploads/(:any)', 'UploadsController::show/$1');

    $routes->group('admin', ['filter' => 'jwt'], static function ($routes) {
        $routes->get('petugas', 'PetugasController::index');
        $routes->post('petugas', 'PetugasController::create');
        $routes->put('petugas/(:num)', 'PetugasController::update/$1');
        $routes->delete('petugas/(:num)', 'PetugasController::delete/$1');
        $routes->get('survei/rekap', 'SurveiController::rekap');
    });
});
```

- [ ] **Step 3: Jalankan test, verifikasi RED**

```bash
vendor/bin/phpunit tests/Controllers/Api/SurveiControllerTest.php 2>&1 | tail -15
```

Expected: FAIL.

- [ ] **Step 4: Implement SurveiController**

Create `app/Controllers/Api/SurveiController.php`:

```php
<?php

namespace App\Controllers\Api;

use App\Models\PetugasModel;
use App\Models\SurveiModel;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;

class SurveiController extends ResourceController
{
    public function submit(): ResponseInterface
    {
        $json  = $this->request->getJSON(true) ?? [];
        $rules = [
            'petugas_id' => 'required|integer',
            'kecepatan'  => 'required|integer|greater_than[0]|less_than[6]',
            'keramahan'  => 'required|integer|greater_than[0]|less_than[6]',
            'informasi'  => 'required|integer|greater_than[0]|less_than[6]',
            'kenyamanan' => 'required|integer|greater_than[0]|less_than[6]',
            'saran'      => 'permit_empty|string|max_length[1000]',
        ];

        if (! $this->validateData($json, $rules)) {
            return $this->response->setStatusCode(422)->setJSON([
                'status'   => 422,
                'error'    => 'Validation Error',
                'messages' => $this->validator->getErrors(),
            ]);
        }

        $petugas = (new PetugasModel())->getActiveDetail((int) $json['petugas_id']);
        if ($petugas === null) {
            return $this->response->setStatusCode(422)->setJSON([
                'status'   => 422,
                'error'    => 'Validation Error',
                'messages' => ['petugas_id' => 'Petugas tidak ditemukan atau tidak aktif'],
            ]);
        }

        (new SurveiModel())->insert([
            'petugas_id' => (int) $json['petugas_id'],
            'kecepatan'  => (int) $json['kecepatan'],
            'keramahan'  => (int) $json['keramahan'],
            'informasi'  => (int) $json['informasi'],
            'kenyamanan' => (int) $json['kenyamanan'],
            'saran'      => $json['saran'] ?? null,
        ]);

        return $this->response->setStatusCode(201)->setJSON([
            'message' => 'Terima kasih atas penilaian Anda',
        ]);
    }

    public function rekap(): ResponseInterface
    {
        $start = (string) ($this->request->getGet('start') ?? date('Y-m-d'));
        $end   = (string) ($this->request->getGet('end') ?? date('Y-m-d'));

        return $this->response->setJSON((new SurveiModel())->getRekapByDateRange($start, $end));
    }
}
```

- [ ] **Step 5: Implement UploadsController**

Create `app/Controllers/Api/UploadsController.php`:

```php
<?php

namespace App\Controllers\Api;

use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;

class UploadsController extends ResourceController
{
    public function show($filename = null): ResponseInterface
    {
        // Cegah path traversal
        $safeFilename = basename((string) $filename);
        $filepath     = WRITEPATH . 'uploads/' . $safeFilename;

        if (! is_file($filepath)) {
            return $this->response->setStatusCode(404)->setJSON([
                'status' => 404,
                'error'  => 'File tidak ditemukan',
            ]);
        }

        return $this->response
            ->setHeader('Content-Type', mime_content_type($filepath) ?: 'application/octet-stream')
            ->setBody(file_get_contents($filepath));
    }
}
```

- [ ] **Step 6: Jalankan test, verifikasi GREEN**

```bash
vendor/bin/phpunit tests/Controllers/Api/SurveiControllerTest.php 2>&1 | tail -15
```

Expected: `OK (5 tests, ...)`.

- [ ] **Step 7: Commit**

```bash
git add app/Controllers/Api/SurveiController.php app/Controllers/Api/UploadsController.php app/Config/Routes.php tests/Controllers/Api/SurveiControllerTest.php
git commit -m "feat: add SurveiController dan UploadsController dengan tests"
```

---

### Task 9: ExportController dengan TDD

**Files:**
- Create: `app/Controllers/Api/ExportController.php`
- Modify: `app/Config/Routes.php`
- Create: `tests/Controllers/Api/ExportControllerTest.php`

- [ ] **Step 1: Tulis test ExportController (RED)**

Create `tests/Controllers/Api/ExportControllerTest.php`:

```php
<?php

namespace Tests\Controllers\Api;

use App\Libraries\JwtLibrary;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;
use CodeIgniter\Test\FeatureTestTrait;

/**
 * @internal
 */
final class ExportControllerTest extends CIUnitTestCase
{
    use DatabaseTestTrait;
    use FeatureTestTrait;

    protected $migrate   = true;
    protected $refresh   = true;
    protected $seed      = 'App\Database\Seeds\DatabaseSeeder';
    protected $namespace = 'App';

    public function testExportMembutuhkanAuth(): void
    {
        $result = $this->call('get', '/api/admin/survei/export');

        $result->assertStatus(401);
    }

    public function testExportMengembalikanFileXlsx(): void
    {
        $token   = (new JwtLibrary())->encode(['admin_id' => 1, 'username' => 'admin']);
        $headers = ['Authorization' => 'Bearer ' . $token];

        $today = date('Y-m-d');
        $result = $this->withHeaders($headers)->call('get', "/api/admin/survei/export?start={$today}&end={$today}");

        $result->assertStatus(200);
        $result->assertHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        $this->assertNotEmpty($result->getBody());
        // Magic bytes XLSX (PK zip)
        $this->assertSame('PK', substr($result->getBody(), 0, 2));
    }
}
```

- [ ] **Step 2: Tambah route**

Modify `app/Config/Routes.php` — di dalam grup `admin`, tambah baris:

```php
        $routes->get('survei/export', 'ExportController::excel');
```

- [ ] **Step 3: Jalankan test, verifikasi RED**

```bash
vendor/bin/phpunit tests/Controllers/Api/ExportControllerTest.php 2>&1 | tail -10
```

Expected: FAIL.

- [ ] **Step 4: Implement ExportController**

Create `app/Controllers/Api/ExportController.php`:

```php
<?php

namespace App\Controllers\Api;

use App\Models\SurveiModel;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class ExportController extends ResourceController
{
    public function excel(): ResponseInterface
    {
        $start = (string) ($this->request->getGet('start') ?? date('Y-m-d'));
        $end   = (string) ($this->request->getGet('end') ?? date('Y-m-d'));
        $rekap = (new SurveiModel())->getRekapByDateRange($start, $end);

        $spreadsheet = new Spreadsheet();

        $this->buildRingkasanSheet($spreadsheet->getActiveSheet(), $rekap['summary'], $start, $end);
        $this->buildPerPetugasSheet($spreadsheet->createSheet(), $rekap['per_petugas']);
        $this->buildDataMentahSheet($spreadsheet->createSheet(), $rekap['semua']);

        // Tulis ke memori, bukan filesystem
        ob_start();
        (new Xlsx($spreadsheet))->save('php://output');
        $body = ob_get_clean();

        $filename = "laporan-ikm-{$start}-{$end}.xlsx";

        return $this->response
            ->setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            ->setHeader('Content-Disposition', "attachment; filename=\"{$filename}\"")
            ->setBody($body);
    }

    private function buildRingkasanSheet($sheet, array $summary, string $start, string $end): void
    {
        $sheet->setTitle('Ringkasan IKM');
        $sheet->setCellValue('A1', 'Laporan Indeks Kepuasan Masyarakat');
        $sheet->setCellValue('A2', "Periode: {$start} s/d {$end}");
        $sheet->setCellValue('A4', 'Total Responden');
        $sheet->setCellValue('B4', $summary['total_responden']);
        $sheet->setCellValue('A5', 'IKM');
        $sheet->setCellValue('B5', $summary['ikm']);
        $sheet->setCellValue('A7', 'Rata-rata per Aspek');
        $sheet->setCellValue('A8', 'Kecepatan');
        $sheet->setCellValue('B8', $summary['rata_rata']['kecepatan']);
        $sheet->setCellValue('A9', 'Keramahan');
        $sheet->setCellValue('B9', $summary['rata_rata']['keramahan']);
        $sheet->setCellValue('A10', 'Informasi');
        $sheet->setCellValue('B10', $summary['rata_rata']['informasi']);
        $sheet->setCellValue('A11', 'Kenyamanan');
        $sheet->setCellValue('B11', $summary['rata_rata']['kenyamanan']);
    }

    private function buildPerPetugasSheet($sheet, array $perPetugas): void
    {
        $sheet->setTitle('Per Petugas');
        $headers = ['A1' => 'Nama', 'B1' => 'Responden', 'C1' => 'Kecepatan', 'D1' => 'Keramahan', 'E1' => 'Informasi', 'F1' => 'Kenyamanan'];
        foreach ($headers as $cell => $val) {
            $sheet->setCellValue($cell, $val);
        }

        $row = 2;
        foreach ($perPetugas as $p) {
            $sheet->setCellValue("A{$row}", $p['nama']);
            $sheet->setCellValue("B{$row}", $p['total_responden']);
            $sheet->setCellValue("C{$row}", $p['rata_rata']['kecepatan']);
            $sheet->setCellValue("D{$row}", $p['rata_rata']['keramahan']);
            $sheet->setCellValue("E{$row}", $p['rata_rata']['informasi']);
            $sheet->setCellValue("F{$row}", $p['rata_rata']['kenyamanan']);
            $row++;
        }
    }

    private function buildDataMentahSheet($sheet, array $semua): void
    {
        $sheet->setTitle('Data Mentah');
        $headers = ['A1' => 'ID', 'B1' => 'Petugas ID', 'C1' => 'Kecepatan', 'D1' => 'Keramahan', 'E1' => 'Informasi', 'F1' => 'Kenyamanan', 'G1' => 'Saran', 'H1' => 'Tanggal'];
        foreach ($headers as $cell => $val) {
            $sheet->setCellValue($cell, $val);
        }

        $row = 2;
        foreach ($semua as $s) {
            $sheet->setCellValue("A{$row}", $s['id']);
            $sheet->setCellValue("B{$row}", $s['petugas_id']);
            $sheet->setCellValue("C{$row}", $s['kecepatan']);
            $sheet->setCellValue("D{$row}", $s['keramahan']);
            $sheet->setCellValue("E{$row}", $s['informasi']);
            $sheet->setCellValue("F{$row}", $s['kenyamanan']);
            $sheet->setCellValue("G{$row}", $s['saran'] ?? '');
            $sheet->setCellValue("H{$row}", $s['created_at']);
            $row++;
        }
    }
}
```

- [ ] **Step 5: Jalankan test, verifikasi GREEN**

```bash
vendor/bin/phpunit tests/Controllers/Api/ExportControllerTest.php 2>&1 | tail -10
```

Expected: `OK (2 tests, ...)`.

- [ ] **Step 6: Commit**

```bash
git add app/Controllers/Api/ExportController.php app/Config/Routes.php tests/Controllers/Api/ExportControllerTest.php
git commit -m "feat: add ExportController untuk laporan Excel dengan tests"
```

---

### Task 10: Verifikasi Penuh Backend

**Files:** Tidak ada perubahan kode.

- [ ] **Step 1: Jalankan seluruh test suite**

```bash
vendor/bin/phpunit --testdox 2>&1 | tail -40
```

Expected: Semua test PASS. Tidak ada error/fail/skip yang tidak diharapkan.

- [ ] **Step 2: Manual smoke test endpoint publik**

```bash
php spark serve > /tmp/ci4.log 2>&1 &
SERVE_PID=$!
sleep 2

# Public: get petugas
curl -s http://localhost:8080/api/petugas/1 | head -c 300
echo ""

# Public: submit survei
curl -s -X POST http://localhost:8080/api/survei \
  -H "Content-Type: application/json" \
  -d '{"petugas_id":1,"kecepatan":5,"keramahan":5,"informasi":5,"kenyamanan":5,"saran":"Test"}' | head -c 200
echo ""

# Login → ambil token
TOKEN=$(curl -s -X POST http://localhost:8080/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "TOKEN: ${TOKEN:0:30}..."

# Protected: list petugas
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/admin/petugas | head -c 300
echo ""

# Protected: rekap
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/admin/survei/rekap | head -c 400
echo ""

kill $SERVE_PID 2>/dev/null
```

Expected: response JSON valid di setiap endpoint.

- [ ] **Step 3: Commit (jika tidak ada perubahan kode, skip — tidak perlu empty commit)**

---

## Phase 4: Frontend Foundation (Task 11-14)

### Task 11: Setup React + Vite + TypeScript + Vitest

**Files:**
- Create: `frontend/` (Vite scaffold)
- Modify: `frontend/vite.config.ts`
- Modify: `frontend/tsconfig.json`, `frontend/tsconfig.app.json`
- Create: `frontend/vitest.config.ts`
- Create: `frontend/src/test/setup.ts`

- [ ] **Step 1: Scaffold React project**

```bash
cd /home/moohard/dev/project/survey-petugas
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
```

- [ ] **Step 2: Install dependencies runtime & test**

```bash
cd /home/moohard/dev/project/survey-petugas/frontend
npm install react-router-dom axios qrcode.react
npm install -D @types/node vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 3: Konfigurasi Vite proxy**

Overwrite `frontend/vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: '../public/app',
    emptyOutDir: true,
  },
})
```

- [ ] **Step 4: Setup Vitest config**

Create `frontend/vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
})
```

Create `frontend/src/test/setup.ts`:

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Setup tsconfig paths**

Edit `frontend/tsconfig.json` dan `frontend/tsconfig.app.json` — tambahkan ke `compilerOptions`:

```json
"baseUrl": ".",
"paths": { "@/*": ["./src/*"] }
```

Edit `frontend/tsconfig.app.json` — tambahkan `"vitest/globals"` dan `"@testing-library/jest-dom"` ke `compilerOptions.types`:

```json
"types": ["vite/client", "vitest/globals", "@testing-library/jest-dom"]
```

- [ ] **Step 6: Tambah script test ke package.json**

Edit `frontend/package.json` — tambahkan ke `scripts`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 7: Verifikasi smoke test**

Create `frontend/src/test/smoke.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'

describe('smoke', () => {
  it('vitest setup berjalan', () => {
    expect(1 + 1).toBe(2)
  })
})
```

```bash
cd /home/moohard/dev/project/survey-petugas/frontend
npm test 2>&1 | tail -10
```

Expected: `1 passed`.

- [ ] **Step 8: Commit**

```bash
cd /home/moohard/dev/project/survey-petugas
git add frontend/
git commit -m "feat: scaffold React frontend dengan Vite, TypeScript, Vitest, dan API proxy"
```

---

### Task 12: Install shadcn/ui + Magic UI Components

**Files:**
- Modify: `frontend/` (otomatis via shadcn CLI)

- [ ] **Step 1: Install Tailwind dan dependency dasar**

```bash
cd /home/moohard/dev/project/survey-petugas/frontend
npm install -D tailwindcss@^4 @tailwindcss/vite
npm install class-variance-authority clsx tailwind-merge lucide-react
npm install motion next-themes
```

- [ ] **Step 2: Register Tailwind v4 plugin di Vite config**

Tailwind v4 wajib di-register sebagai Vite plugin — tanpa ini CSS tidak diproses dan UI akan blank.

Edit `frontend/vite.config.ts` — tambahkan import dan plugin `tailwindcss()`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: '../public/app',
    emptyOutDir: true,
  },
})
```

Pastikan juga `frontend/src/index.css` punya `@import "tailwindcss";` di paling atas (akan ditambahkan otomatis oleh shadcn init di step berikutnya).

- [ ] **Step 3: Initialize shadcn/ui**

```bash
npx shadcn@latest init --yes --base-color slate
```

Jika prompt interaktif tetap muncul, jawab default (TypeScript: yes, style: default, base color: slate).

- [ ] **Step 4: Install shadcn/ui components**

```bash
npx shadcn@latest add card button input label textarea form avatar badge \
  table dialog alert-dialog dropdown-menu sidebar tabs calendar popover \
  skeleton sonner chart separator scroll-area select
```

- [ ] **Step 5: Install Magic UI components**

```bash
npx shadcn@latest add "https://magicui.design/r/number-ticker.json"
npx shadcn@latest add "https://magicui.design/r/magic-card.json"
npx shadcn@latest add "https://magicui.design/r/animated-circular-progress-bar.json"
npx shadcn@latest add "https://magicui.design/r/blur-fade.json"
npx shadcn@latest add "https://magicui.design/r/border-beam.json"
npx shadcn@latest add "https://magicui.design/r/shimmer-button.json"
npx shadcn@latest add "https://magicui.design/r/confetti.json"
npx shadcn@latest add "https://magicui.design/r/dot-pattern.json"
npx shadcn@latest add "https://magicui.design/r/shine-border.json"
```

- [ ] **Step 6: Verifikasi build dan commit**

```bash
npm run build 2>&1 | tail -10
```

Expected: Build success tanpa error TypeScript dan tanpa warning Tailwind.

```bash
cd /home/moohard/dev/project/survey-petugas
git add frontend/
git commit -m "feat: install Tailwind v4 plugin, shadcn/ui, dan Magic UI components"
```

---

### Task 13: TypeScript Types, API Client, useAuth Hook (dengan TDD)

**Files:**
- Create: `frontend/src/types/index.ts`
- Create: `frontend/src/lib/api.ts`
- Create: `frontend/src/hooks/useAuth.ts`
- Create: `frontend/src/hooks/useAuth.test.ts`

- [ ] **Step 1: Buat TypeScript types**

Create `frontend/src/types/index.ts`:

```typescript
export interface Petugas {
  id: number
  nama: string
  foto_url: string
  loket: string
  unit_kerja: string
  is_active?: number
}

export interface SurveiPayload {
  petugas_id: number
  kecepatan: number
  keramahan: number
  informasi: number
  kenyamanan: number
  saran?: string
}

export interface SurveiRecord {
  id: number
  petugas_id: number
  kecepatan: number
  keramahan: number
  informasi: number
  kenyamanan: number
  saran: string | null
  created_at: string
}

export interface LoginPayload {
  username: string
  password: string
}

export interface AdminInfo {
  id: number
  username: string
  nama: string
}

export interface LoginResponse {
  token: string
  admin: AdminInfo
}

export interface RataRata {
  kecepatan: number
  keramahan: number
  informasi: number
  kenyamanan: number
}

export interface RekapSummary {
  total_responden: number
  rata_rata: RataRata
  ikm: number
}

export interface RekapPerPetugas {
  petugas_id: number
  nama: string
  foto_url: string
  total_responden: number
  rata_rata: RataRata
}

export interface RekapResponse {
  summary: RekapSummary
  per_petugas: RekapPerPetugas[]
  semua: SurveiRecord[]
}

export interface ApiError {
  status: number
  error: string
  messages?: Record<string, string>
}
```

- [ ] **Step 2: Buat API client**

Create `frontend/src/lib/api.ts`:

```typescript
import axios, { AxiosError } from 'axios'
import type {
  LoginPayload,
  LoginResponse,
  Petugas,
  SurveiPayload,
  RekapResponse,
  ApiError,
} from '@/types'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('admin')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

export async function getPetugas(id: number): Promise<Petugas> {
  return (await api.get<Petugas>(`/petugas/${id}`)).data
}

export async function submitSurvei(payload: SurveiPayload): Promise<{ message: string }> {
  return (await api.post<{ message: string }>('/survei', payload)).data
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  return (await api.post<LoginResponse>('/login', payload)).data
}

export async function getAdminPetugas(): Promise<Petugas[]> {
  return (await api.get<Petugas[]>('/admin/petugas')).data
}

export async function createPetugas(formData: FormData): Promise<Petugas> {
  return (
    await api.post<Petugas>('/admin/petugas', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  ).data
}

/**
 * Update petugas via HTTP method spoofing — kirim POST dengan field _method=PUT
 * karena PHP tidak parse multipart untuk PUT secara native.
 */
export async function updatePetugas(id: number, formData: FormData): Promise<Petugas> {
  formData.append('_method', 'PUT')
  return (
    await api.post<Petugas>(`/admin/petugas/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  ).data
}

export async function deletePetugas(id: number): Promise<{ message: string }> {
  return (await api.delete<{ message: string }>(`/admin/petugas/${id}`)).data
}

export async function getRekap(start: string, end: string): Promise<RekapResponse> {
  return (await api.get<RekapResponse>(`/admin/survei/rekap?start=${start}&end=${end}`)).data
}

export function getExportUrl(start: string, end: string): string {
  return `/api/admin/survei/export?start=${start}&end=${end}`
}

export default api
```

- [ ] **Step 3: Tulis test useAuth (RED)**

Create `frontend/src/hooks/useAuth.test.ts`:

```typescript
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from './useAuth'
import * as apiModule from '@/lib/api'

describe('useAuth', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('isAuthenticated awal false jika tidak ada token', () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.admin).toBeNull()
  })

  it('login menyimpan token dan admin ke localStorage', async () => {
    const fakeResponse = {
      token: 'abc.def.ghi',
      admin: { id: 1, username: 'admin', nama: 'Administrator' },
    }
    vi.spyOn(apiModule, 'login').mockResolvedValue(fakeResponse)

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.login({ username: 'admin', password: 'admin123' })
    })

    expect(localStorage.getItem('token')).toBe('abc.def.ghi')
    expect(JSON.parse(localStorage.getItem('admin')!)).toEqual(fakeResponse.admin)
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('logout menghapus token dan admin', () => {
    localStorage.setItem('token', 'abc')
    localStorage.setItem('admin', JSON.stringify({ id: 1, username: 'a', nama: 'A' }))

    const { result } = renderHook(() => useAuth())
    expect(result.current.isAuthenticated).toBe(true)

    act(() => {
      result.current.logout()
    })

    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('admin')).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })
})
```

- [ ] **Step 4: Jalankan test, verifikasi RED**

```bash
cd /home/moohard/dev/project/survey-petugas/frontend
npm test 2>&1 | tail -10
```

Expected: FAIL — useAuth belum ada.

- [ ] **Step 5: Implement useAuth**

Create `frontend/src/hooks/useAuth.ts`:

```typescript
import { useCallback, useState } from 'react'
import { login as loginApi } from '@/lib/api'
import type { AdminInfo, LoginPayload } from '@/types'

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    () => !!localStorage.getItem('token'),
  )
  const [admin, setAdmin] = useState<AdminInfo | null>(() => {
    const stored = localStorage.getItem('admin')
    return stored ? (JSON.parse(stored) as AdminInfo) : null
  })

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await loginApi(payload)
    localStorage.setItem('token', response.token)
    localStorage.setItem('admin', JSON.stringify(response.admin))
    setIsAuthenticated(true)
    setAdmin(response.admin)
    return response
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('admin')
    setIsAuthenticated(false)
    setAdmin(null)
  }, [])

  return { isAuthenticated, admin, login, logout }
}
```

- [ ] **Step 6: Jalankan test, verifikasi GREEN**

```bash
npm test 2>&1 | tail -10
```

Expected: All tests PASS.

- [ ] **Step 7: Commit**

```bash
cd /home/moohard/dev/project/survey-petugas
git add frontend/src/types/ frontend/src/lib/api.ts frontend/src/hooks/
git commit -m "feat: add TypeScript types, API client, dan useAuth hook dengan tests"
```

---

### Task 14: App Routing, Layout, ProtectedRoute

**Files:**
- Overwrite: `frontend/src/main.tsx`
- Overwrite: `frontend/src/App.tsx`
- Create: `frontend/src/components/layout/AdminLayout.tsx`
- Create: `frontend/src/components/layout/ProtectedRoute.tsx`
- Create stub pages: `frontend/src/pages/{SurveyPage,LoginPage,DashboardPage,PetugasPage}.tsx`

- [ ] **Step 1: Setup main.tsx**

Overwrite `frontend/src/main.tsx`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="light">
      <BrowserRouter>
        <App />
        <Toaster richColors position="top-center" />
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
)
```

- [ ] **Step 2: Buat ProtectedRoute**

Create `frontend/src/components/layout/ProtectedRoute.tsx`:

```tsx
import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  return localStorage.getItem('token') ? <>{children}</> : <Navigate to="/login" replace />
}
```

- [ ] **Step 3: Buat AdminLayout**

Create `frontend/src/components/layout/AdminLayout.tsx`:

```tsx
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, LogOut, Users } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { useAuth } from '@/hooks/useAuth'

const menuItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Petugas', url: '/petugas', icon: Users },
]

export function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuth()

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Survei PTSP</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        isActive={location.pathname === item.url}
                        onClick={() => navigate(item.url)}
                      >
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => {
                        logout()
                        navigate('/login')
                      }}
                    >
                      <LogOut className="size-4" />
                      <span>Logout</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <main className="flex-1 p-6">
          <SidebarTrigger className="mb-4" />
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  )
}
```

- [ ] **Step 4: Buat stub pages (placeholder minimal — diisi penuh di Task 15-18)**

Create `frontend/src/pages/SurveyPage.tsx`:

```tsx
export default function SurveyPage() {
  return <div data-testid="survey-page">Survey Page (placeholder)</div>
}
```

Create `frontend/src/pages/LoginPage.tsx`:

```tsx
export default function LoginPage() {
  return <div data-testid="login-page">Login Page (placeholder)</div>
}
```

Create `frontend/src/pages/DashboardPage.tsx`:

```tsx
export default function DashboardPage() {
  return <div data-testid="dashboard-page">Dashboard Page (placeholder)</div>
}
```

Create `frontend/src/pages/PetugasPage.tsx`:

```tsx
export default function PetugasPage() {
  return <div data-testid="petugas-page">Petugas Page (placeholder)</div>
}
```

- [ ] **Step 5: Setup App.tsx routing**

Overwrite `frontend/src/App.tsx`:

```tsx
import { Route, Routes } from 'react-router-dom'
import SurveyPage from '@/pages/SurveyPage'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import PetugasPage from '@/pages/PetugasPage'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/survey/:petugasId" element={<SurveyPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/petugas" element={<PetugasPage />} />
      </Route>
    </Routes>
  )
}
```

- [ ] **Step 6: Verifikasi build dan test**

```bash
cd /home/moohard/dev/project/survey-petugas/frontend
npm run build 2>&1 | tail -10
npm test 2>&1 | tail -10
```

Expected: build OK, semua test PASS.

- [ ] **Step 7: Commit**

```bash
cd /home/moohard/dev/project/survey-petugas
git add frontend/src/
git commit -m "feat: add React Router, AdminLayout dengan sidebar, ProtectedRoute, dan stub pages"
```

---

## Phase 5: Frontend Pages dengan TDD (Task 15-18)

### Task 15: Halaman Survei dengan StarRating (TDD)

**Files:**
- Create: `frontend/src/components/survey/StarRating.tsx`
- Create: `frontend/src/components/survey/StarRating.test.tsx`
- Overwrite: `frontend/src/pages/SurveyPage.tsx`
- Create: `frontend/src/pages/SurveyPage.test.tsx`

- [ ] **Step 1: Tulis test StarRating (RED)**

Create `frontend/src/components/survey/StarRating.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { StarRating } from './StarRating'

describe('StarRating', () => {
  it('merender 5 bintang', () => {
    render(<StarRating value={0} onChange={() => {}} label="Test" />)
    expect(screen.getAllByRole('button')).toHaveLength(5)
  })

  it('memanggil onChange saat bintang diklik', () => {
    const handleChange = vi.fn()
    render(<StarRating value={0} onChange={handleChange} label="Test" />)

    const stars = screen.getAllByRole('button')
    fireEvent.click(stars[3])

    expect(handleChange).toHaveBeenCalledWith(4)
  })

  it('menampilkan label', () => {
    render(<StarRating value={0} onChange={() => {}} label="Kecepatan" />)
    expect(screen.getByText('Kecepatan')).toBeInTheDocument()
  })

  it('menandai bintang aktif berdasarkan value', () => {
    render(<StarRating value={3} onChange={() => {}} label="Test" />)
    const stars = screen.getAllByRole('button')
    // 3 bintang pertama harus punya class active (data-active="true")
    expect(stars[0]).toHaveAttribute('data-active', 'true')
    expect(stars[2]).toHaveAttribute('data-active', 'true')
    expect(stars[3]).toHaveAttribute('data-active', 'false')
  })
})
```

- [ ] **Step 2: Jalankan test, verifikasi RED**

```bash
cd /home/moohard/dev/project/survey-petugas/frontend
npm test src/components/survey 2>&1 | tail -10
```

Expected: FAIL — komponen belum ada.

- [ ] **Step 3: Implement StarRating**

Create `frontend/src/components/survey/StarRating.tsx`:

```tsx
import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value: number
  onChange: (value: number) => void
  label: string
}

export function StarRating({ value, onChange, label }: StarRatingProps) {
  const [hover, setHover] = useState<number>(0)
  const display = hover || value

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => {
          const active = n <= display
          return (
            <button
              key={n}
              type="button"
              data-active={active}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => onChange(n)}
              aria-label={`Rating ${n}`}
              className={cn(
                'rounded-full p-1 transition-transform hover:scale-110',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              )}
            >
              <Star
                className={cn(
                  'size-8 transition-colors',
                  active ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground',
                )}
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Jalankan test StarRating, verifikasi GREEN**

```bash
npm test src/components/survey 2>&1 | tail -10
```

Expected: All 4 tests PASS.

- [ ] **Step 5: Tulis test SurveyPage (RED)**

Create `frontend/src/pages/SurveyPage.test.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SurveyPage from './SurveyPage'
import * as apiModule from '@/lib/api'

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/survey/:petugasId" element={<SurveyPage />} />
      </Routes>
    </MemoryRouter>,
  )

describe('SurveyPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('menampilkan data petugas setelah load', async () => {
    vi.spyOn(apiModule, 'getPetugas').mockResolvedValue({
      id: 1,
      nama: 'Budi Santoso',
      foto_url: '/api/uploads/budi.png',
      loket: 'Loket 1',
      unit_kerja: 'Pelayanan Umum',
    })

    renderAt('/survey/1')

    await waitFor(() => {
      expect(screen.getByText('Budi Santoso')).toBeInTheDocument()
    })
    expect(screen.getByText(/Loket 1/i)).toBeInTheDocument()
  })

  it('menonaktifkan submit jika belum semua aspek dirating', async () => {
    vi.spyOn(apiModule, 'getPetugas').mockResolvedValue({
      id: 1,
      nama: 'Budi',
      foto_url: '/api/uploads/budi.png',
      loket: 'Loket 1',
      unit_kerja: 'Umum',
    })

    renderAt('/survey/1')
    await waitFor(() => screen.getByText('Budi'))

    const submit = screen.getByTestId('submit-survey')
    expect(submit).toBeDisabled()
  })

  it('mengirim survei saat semua aspek terisi', async () => {
    vi.spyOn(apiModule, 'getPetugas').mockResolvedValue({
      id: 1,
      nama: 'Budi',
      foto_url: '/api/uploads/budi.png',
      loket: 'Loket 1',
      unit_kerja: 'Umum',
    })
    const submitSpy = vi
      .spyOn(apiModule, 'submitSurvei')
      .mockResolvedValue({ message: 'Terima kasih' })

    renderAt('/survey/1')
    await waitFor(() => screen.getByText('Budi'))

    const user = userEvent.setup()
    // Klik bintang ke-5 untuk semua 4 aspek
    for (const aspek of ['Kecepatan', 'Keramahan', 'Informasi', 'Kenyamanan']) {
      const group = screen.getByText(aspek).closest('div')!
      const stars = group.querySelectorAll('button')
      await user.click(stars[4])
    }

    const submit = screen.getByTestId('submit-survey')
    await user.click(submit)

    await waitFor(() => {
      expect(submitSpy).toHaveBeenCalledWith({
        petugas_id: 1,
        kecepatan: 5,
        keramahan: 5,
        informasi: 5,
        kenyamanan: 5,
        saran: '',
      })
    })
  })
})
```

- [ ] **Step 6: Jalankan test SurveyPage, verifikasi RED**

```bash
npm test src/pages/SurveyPage 2>&1 | tail -10
```

Expected: FAIL.

- [ ] **Step 7: Implement SurveyPage**

Overwrite `frontend/src/pages/SurveyPage.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { BorderBeam } from '@/components/magicui/border-beam'
import { BlurFade } from '@/components/magicui/blur-fade'
import { DotPattern } from '@/components/magicui/dot-pattern'
import { Confetti, type ConfettiRef } from '@/components/magicui/confetti'
import { ShimmerButton } from '@/components/magicui/shimmer-button'
import { StarRating } from '@/components/survey/StarRating'
import { getPetugas, submitSurvei } from '@/lib/api'
import type { Petugas } from '@/types'
import { cn } from '@/lib/utils'

type Ratings = { kecepatan: number; keramahan: number; informasi: number; kenyamanan: number }

const ASPEK: Array<{ key: keyof Ratings; label: string }> = [
  { key: 'kecepatan', label: 'Kecepatan' },
  { key: 'keramahan', label: 'Keramahan' },
  { key: 'informasi', label: 'Informasi' },
  { key: 'kenyamanan', label: 'Kenyamanan' },
]

export default function SurveyPage() {
  const { petugasId } = useParams<{ petugasId: string }>()
  const [petugas, setPetugas] = useState<Petugas | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [ratings, setRatings] = useState<Ratings>({ kecepatan: 0, keramahan: 0, informasi: 0, kenyamanan: 0 })
  const [saran, setSaran] = useState<string>('')
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [success, setSuccess] = useState<boolean>(false)
  const confettiRef = useRef<ConfettiRef>(null)

  useEffect(() => {
    if (!petugasId) return
    setLoading(true)
    getPetugas(Number(petugasId))
      .then(setPetugas)
      .catch(() => toast.error('Gagal memuat data petugas'))
      .finally(() => setLoading(false))
  }, [petugasId])

  const isReady = ASPEK.every(({ key }) => ratings[key] > 0)

  const handleSubmit = async () => {
    if (!petugas || !isReady) return
    setSubmitting(true)
    try {
      await submitSurvei({
        petugas_id: petugas.id,
        kecepatan: ratings.kecepatan,
        keramahan: ratings.keramahan,
        informasi: ratings.informasi,
        kenyamanan: ratings.kenyamanan,
        saran,
      })
      setSuccess(true)
      confettiRef.current?.fire?.({})
      toast.success('Terima kasih atas penilaian Anda')
      // Auto-reset 3 detik untuk mode kiosk
      setTimeout(() => {
        setRatings({ kecepatan: 0, keramahan: 0, informasi: 0, kenyamanan: 0 })
        setSaran('')
        setSuccess(false)
      }, 3000)
    } catch {
      toast.error('Gagal mengirim survei. Silakan coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-background p-4">
      <DotPattern
        className={cn('[mask-image:radial-gradient(400px_circle_at_center,white,transparent)]')}
      />
      <Confetti ref={confettiRef} className="pointer-events-none absolute inset-0 z-50" />

      <BlurFade delay={0.1}>
        <Card className="relative w-full max-w-md overflow-hidden">
          <BorderBeam size={250} duration={12} />
          <CardContent className="space-y-6 p-6">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="mx-auto size-24 rounded-full" />
                <Skeleton className="mx-auto h-6 w-48" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : petugas ? (
              <>
                <div className="flex flex-col items-center gap-3">
                  <Avatar className="size-24">
                    <AvatarImage src={petugas.foto_url} alt={petugas.nama} />
                    <AvatarFallback>{petugas.nama.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <h1 className="text-xl font-semibold">{petugas.nama}</h1>
                    <p className="text-sm text-muted-foreground">
                      {petugas.loket} · {petugas.unit_kerja}
                    </p>
                  </div>
                </div>

                {success ? (
                  <div className="py-12 text-center">
                    <h2 className="text-2xl font-bold text-primary">Terima Kasih!</h2>
                    <p className="mt-2 text-muted-foreground">Penilaian Anda telah tersimpan.</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {ASPEK.map(({ key, label }) => (
                        <StarRating
                          key={key}
                          label={label}
                          value={ratings[key]}
                          onChange={(v) => setRatings((prev) => ({ ...prev, [key]: v }))}
                        />
                      ))}
                    </div>

                    <Textarea
                      placeholder="Saran (opsional)..."
                      value={saran}
                      onChange={(e) => setSaran(e.target.value)}
                      maxLength={1000}
                    />

                    <ShimmerButton
                      onClick={handleSubmit}
                      disabled={!isReady || submitting}
                      className="w-full"
                      data-testid="submit-survey"
                    >
                      {submitting ? 'Mengirim...' : 'Kirim Penilaian'}
                    </ShimmerButton>
                  </>
                )}
              </>
            ) : (
              <p className="py-12 text-center text-muted-foreground">Petugas tidak ditemukan.</p>
            )}
          </CardContent>
        </Card>
      </BlurFade>
    </div>
  )
}
```

- [ ] **Step 8: Jalankan test, verifikasi GREEN**

```bash
npm test src/pages/SurveyPage 2>&1 | tail -10
```

Expected: All tests PASS.

- [ ] **Step 9: Commit**

```bash
cd /home/moohard/dev/project/survey-petugas
git add frontend/src/components/survey/ frontend/src/pages/SurveyPage.tsx frontend/src/pages/SurveyPage.test.tsx
git commit -m "feat: implement SurveyPage dengan StarRating, kiosk auto-reset, dan tests"
```

---

### Task 16: Halaman Login dengan TDD

**Files:**
- Overwrite: `frontend/src/pages/LoginPage.tsx`
- Create: `frontend/src/pages/LoginPage.test.tsx`

- [ ] **Step 1: Tulis test LoginPage (RED)**

Create `frontend/src/pages/LoginPage.test.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import LoginPage from './LoginPage'
import * as apiModule from '@/lib/api'

const renderPage = () =>
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  )

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('menampilkan form login', () => {
    renderPage()
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
  })

  it('memanggil API login dan redirect saat sukses', async () => {
    vi.spyOn(apiModule, 'login').mockResolvedValue({
      token: 'abc.def.ghi',
      admin: { id: 1, username: 'admin', nama: 'Administrator' },
    })

    renderPage()
    const user = userEvent.setup()

    await user.type(screen.getByLabelText(/username/i), 'admin')
    await user.type(screen.getByLabelText(/password/i), 'admin123')
    await user.click(screen.getByRole('button', { name: /login/i }))

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBe('abc.def.ghi')
    })
  })
})
```

- [ ] **Step 2: Jalankan test, verifikasi RED**

```bash
cd /home/moohard/dev/project/survey-petugas/frontend
npm test src/pages/LoginPage 2>&1 | tail -10
```

Expected: FAIL.

- [ ] **Step 3: Implement LoginPage**

Overwrite `frontend/src/pages/LoginPage.tsx`:

```tsx
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ShineBorder } from '@/components/magicui/shine-border'
import { DotPattern } from '@/components/magicui/dot-pattern'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [username, setUsername] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [submitting, setSubmitting] = useState<boolean>(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await login({ username, password })
      toast.success('Login berhasil')
      navigate('/dashboard')
    } catch (err) {
      const msg =
        // @ts-expect-error error AxiosError shape
        err?.response?.data?.error ?? 'Login gagal. Silakan coba lagi.'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-background p-4">
      <DotPattern className={cn('[mask-image:radial-gradient(400px_circle_at_center,white,transparent)]')} />
      <Card className="relative w-full max-w-sm overflow-hidden">
        <ShineBorder shineColor={['#A07CFE', '#FE8FB5', '#FFBE7B']} />
        <CardHeader>
          <CardTitle className="text-center text-xl">Login Admin</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Memproses...' : 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 4: Jalankan test, verifikasi GREEN**

```bash
npm test src/pages/LoginPage 2>&1 | tail -10
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
cd /home/moohard/dev/project/survey-petugas
git add frontend/src/pages/LoginPage.tsx frontend/src/pages/LoginPage.test.tsx
git commit -m "feat: implement LoginPage dengan form, ShineBorder, dan tests"
```

---

### Task 17: Halaman Dashboard dengan Komponen + TDD

**Files:**
- Create: `frontend/src/components/dashboard/SummaryCards.tsx`
- Create: `frontend/src/components/dashboard/RadarChartCard.tsx`
- Create: `frontend/src/components/dashboard/BarChartCard.tsx`
- Create: `frontend/src/components/dashboard/RekapTable.tsx`
- Create: `frontend/src/components/dashboard/DateFilter.tsx`
- Overwrite: `frontend/src/pages/DashboardPage.tsx`
- Create: `frontend/src/pages/DashboardPage.test.tsx`

- [ ] **Step 1: Tulis test DashboardPage (RED)**

Create `frontend/src/pages/DashboardPage.test.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import DashboardPage from './DashboardPage'
import * as apiModule from '@/lib/api'

const fakeRekap = {
  summary: {
    total_responden: 10,
    rata_rata: { kecepatan: 4.5, keramahan: 4.8, informasi: 4.2, kenyamanan: 4.7 },
    ikm: 91.0,
  },
  per_petugas: [
    {
      petugas_id: 1,
      nama: 'Budi',
      foto_url: '/api/uploads/budi.png',
      total_responden: 5,
      rata_rata: { kecepatan: 5, keramahan: 5, informasi: 4, kenyamanan: 5 },
    },
  ],
  semua: [],
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('menampilkan total responden dari rekap', async () => {
    vi.spyOn(apiModule, 'getRekap').mockResolvedValue(fakeRekap)

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText(/10/)).toBeInTheDocument()
    })
  })

  it('menampilkan nama petugas dari rekap', async () => {
    vi.spyOn(apiModule, 'getRekap').mockResolvedValue(fakeRekap)

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Budi')).toBeInTheDocument()
    })
  })
})
```

- [ ] **Step 2: Jalankan test, verifikasi RED**

```bash
cd /home/moohard/dev/project/survey-petugas/frontend
npm test src/pages/DashboardPage 2>&1 | tail -10
```

Expected: FAIL.

- [ ] **Step 3: Implement SummaryCards**

Create `frontend/src/components/dashboard/SummaryCards.tsx`:

```tsx
import { MagicCard } from '@/components/magicui/magic-card'
import { NumberTicker } from '@/components/magicui/number-ticker'
import { AnimatedCircularProgressBar } from '@/components/magicui/animated-circular-progress-bar'
import type { RekapSummary } from '@/types'

export function SummaryCards({ summary }: { summary: RekapSummary }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      <MagicCard className="p-6">
        <p className="text-sm text-muted-foreground">Total Responden</p>
        <p className="text-3xl font-bold">
          <NumberTicker value={summary.total_responden} />
        </p>
      </MagicCard>

      <MagicCard className="p-6">
        <p className="text-sm text-muted-foreground">IKM</p>
        <div className="mt-2 flex items-center justify-center">
          <AnimatedCircularProgressBar
            max={100}
            value={summary.ikm}
            min={0}
            gaugePrimaryColor="hsl(var(--primary))"
            gaugeSecondaryColor="hsl(var(--muted))"
          />
        </div>
      </MagicCard>

      <MagicCard className="p-6">
        <p className="text-sm text-muted-foreground">Rata Kecepatan</p>
        <p className="text-3xl font-bold">
          <NumberTicker value={summary.rata_rata.kecepatan} decimalPlaces={2} />
        </p>
      </MagicCard>

      <MagicCard className="p-6">
        <p className="text-sm text-muted-foreground">Rata Keramahan</p>
        <p className="text-3xl font-bold">
          <NumberTicker value={summary.rata_rata.keramahan} decimalPlaces={2} />
        </p>
      </MagicCard>
    </div>
  )
}
```

- [ ] **Step 4: Implement RadarChartCard**

Create `frontend/src/components/dashboard/RadarChartCard.tsx`:

```tsx
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { RataRata } from '@/types'

export function RadarChartCard({ rataRata }: { rataRata: RataRata }) {
  const data = [
    { aspek: 'Kecepatan', nilai: rataRata.kecepatan },
    { aspek: 'Keramahan', nilai: rataRata.keramahan },
    { aspek: 'Informasi', nilai: rataRata.informasi },
    { aspek: 'Kenyamanan', nilai: rataRata.kenyamanan },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profil Rata-rata Aspek</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="aspek" />
            <Radar
              dataKey="nilai"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.4}
            />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 5: Implement BarChartCard**

Create `frontend/src/components/dashboard/BarChartCard.tsx`:

```tsx
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { RekapPerPetugas } from '@/types'

export function BarChartCard({ data }: { data: RekapPerPetugas[] }) {
  const chartData = data.map((p) => ({
    nama: p.nama,
    Kecepatan: p.rata_rata.kecepatan,
    Keramahan: p.rata_rata.keramahan,
    Informasi: p.rata_rata.informasi,
    Kenyamanan: p.rata_rata.kenyamanan,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perbandingan per Petugas</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="nama" />
            <YAxis domain={[0, 5]} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Kecepatan" fill="hsl(var(--chart-1))" />
            <Bar dataKey="Keramahan" fill="hsl(var(--chart-2))" />
            <Bar dataKey="Informasi" fill="hsl(var(--chart-3))" />
            <Bar dataKey="Kenyamanan" fill="hsl(var(--chart-4))" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 6: Implement RekapTable**

Create `frontend/src/components/dashboard/RekapTable.tsx`:

```tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { RekapPerPetugas } from '@/types'

export function RekapTable({ data }: { data: RekapPerPetugas[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Detail per Petugas</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Petugas</TableHead>
              <TableHead className="text-right">Responden</TableHead>
              <TableHead className="text-right">Kecepatan</TableHead>
              <TableHead className="text-right">Keramahan</TableHead>
              <TableHead className="text-right">Informasi</TableHead>
              <TableHead className="text-right">Kenyamanan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Belum ada data.
                </TableCell>
              </TableRow>
            ) : (
              data.map((p) => (
                <TableRow key={p.petugas_id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="size-8">
                        <AvatarImage src={p.foto_url} alt={p.nama} />
                        <AvatarFallback>{p.nama.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span>{p.nama}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{p.total_responden}</TableCell>
                  <TableCell className="text-right">{p.rata_rata.kecepatan.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{p.rata_rata.keramahan.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{p.rata_rata.informasi.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{p.rata_rata.kenyamanan.toFixed(2)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 7: Implement DateFilter**

Create `frontend/src/components/dashboard/DateFilter.tsx`:

```tsx
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface DateFilterProps {
  start: string
  end: string
  onStartChange: (v: string) => void
  onEndChange: (v: string) => void
  onExport: () => void
}

export function DateFilter({ start, end, onStartChange, onEndChange, onExport }: DateFilterProps) {
  return (
    <div className="flex flex-col items-start gap-3 md:flex-row md:items-end">
      <div className="space-y-1">
        <Label htmlFor="start">Mulai</Label>
        <Input
          id="start"
          type="date"
          value={start}
          onChange={(e) => onStartChange(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="end">Selesai</Label>
        <Input id="end" type="date" value={end} onChange={(e) => onEndChange(e.target.value)} />
      </div>
      <Button onClick={onExport} variant="outline">
        <Download className="mr-2 size-4" />
        Ekspor Excel
      </Button>
    </div>
  )
}
```

- [ ] **Step 8: Implement DashboardPage**

Overwrite `frontend/src/pages/DashboardPage.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { BlurFade } from '@/components/magicui/blur-fade'
import { Skeleton } from '@/components/ui/skeleton'
import { SummaryCards } from '@/components/dashboard/SummaryCards'
import { RadarChartCard } from '@/components/dashboard/RadarChartCard'
import { BarChartCard } from '@/components/dashboard/BarChartCard'
import { RekapTable } from '@/components/dashboard/RekapTable'
import { DateFilter } from '@/components/dashboard/DateFilter'
import { getRekap, getExportUrl } from '@/lib/api'
import type { RekapResponse } from '@/types'

// Gunakan komponen lokal — toISOString() selalu UTC dan akan miss tanggal di WIB malam.
const today = (): string => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function DashboardPage() {
  const [start, setStart] = useState<string>(today())
  const [end, setEnd] = useState<string>(today())
  const [rekap, setRekap] = useState<RekapResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    setLoading(true)
    getRekap(start, end)
      .then(setRekap)
      .catch(() => toast.error('Gagal memuat data rekap'))
      .finally(() => setLoading(false))
  }, [start, end])

  const handleExport = async () => {
    try {
      const url = getExportUrl(start, end)
      const token = localStorage.getItem('token')
      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!response.ok) throw new Error('Export gagal')

      const blob = await response.blob()
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `laporan-ikm-${start}-${end}.xlsx`
      link.click()
      URL.revokeObjectURL(link.href)
    } catch {
      toast.error('Gagal mengunduh laporan')
    }
  }

  return (
    <div className="space-y-6">
      <BlurFade delay={0.05}>
        <h1 className="text-2xl font-bold">Dashboard IKM</h1>
      </BlurFade>

      <DateFilter
        start={start}
        end={end}
        onStartChange={setStart}
        onEndChange={setEnd}
        onExport={handleExport}
      />

      {loading || !rekap ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Skeleton className="h-72" />
            <Skeleton className="h-72" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <>
          <BlurFade delay={0.1}>
            <SummaryCards summary={rekap.summary} />
          </BlurFade>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <BlurFade delay={0.15}>
              <RadarChartCard rataRata={rekap.summary.rata_rata} />
            </BlurFade>
            <BlurFade delay={0.2}>
              <BarChartCard data={rekap.per_petugas} />
            </BlurFade>
          </div>
          <BlurFade delay={0.25}>
            <RekapTable data={rekap.per_petugas} />
          </BlurFade>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 9: Jalankan test, verifikasi GREEN**

```bash
npm test src/pages/DashboardPage 2>&1 | tail -10
```

Expected: All tests PASS.

- [ ] **Step 10: Commit**

```bash
cd /home/moohard/dev/project/survey-petugas
git add frontend/src/components/dashboard/ frontend/src/pages/DashboardPage.tsx frontend/src/pages/DashboardPage.test.tsx
git commit -m "feat: implement DashboardPage dengan SummaryCards, charts, table, dan tests"
```

---

### Task 18: Halaman Petugas (CRUD + QR Code) dengan TDD

**Files:**
- Create: `frontend/src/components/petugas/PetugasFormDialog.tsx`
- Create: `frontend/src/components/petugas/QrCodeDialog.tsx`
- Overwrite: `frontend/src/pages/PetugasPage.tsx`
- Create: `frontend/src/pages/PetugasPage.test.tsx`

- [ ] **Step 1: Tulis test PetugasPage (RED)**

Create `frontend/src/pages/PetugasPage.test.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import PetugasPage from './PetugasPage'
import * as apiModule from '@/lib/api'

const fakePetugas = [
  { id: 1, nama: 'Budi', foto_url: '/api/uploads/budi.png', loket: 'Loket 1', unit_kerja: 'Umum', is_active: 1 },
  { id: 2, nama: 'Siti', foto_url: '/api/uploads/siti.png', loket: 'Loket 2', unit_kerja: 'Perizinan', is_active: 0 },
]

describe('PetugasPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('menampilkan daftar petugas dari API', async () => {
    vi.spyOn(apiModule, 'getAdminPetugas').mockResolvedValue(fakePetugas)

    render(
      <MemoryRouter>
        <PetugasPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Budi')).toBeInTheDocument()
      expect(screen.getByText('Siti')).toBeInTheDocument()
    })
  })

  it('menampilkan tombol tambah petugas', async () => {
    vi.spyOn(apiModule, 'getAdminPetugas').mockResolvedValue([])

    render(
      <MemoryRouter>
        <PetugasPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /tambah petugas/i })).toBeInTheDocument()
    })
  })

  it('menampilkan badge status non-aktif', async () => {
    vi.spyOn(apiModule, 'getAdminPetugas').mockResolvedValue(fakePetugas)

    render(
      <MemoryRouter>
        <PetugasPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText(/non-aktif/i)).toBeInTheDocument()
    })
  })
})
```

- [ ] **Step 2: Jalankan test, verifikasi RED**

```bash
cd /home/moohard/dev/project/survey-petugas/frontend
npm test src/pages/PetugasPage 2>&1 | tail -10
```

Expected: FAIL.

- [ ] **Step 3: Implement PetugasFormDialog**

Create `frontend/src/components/petugas/PetugasFormDialog.tsx`:

```tsx
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createPetugas, updatePetugas } from '@/lib/api'
import type { Petugas } from '@/types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  petugas?: Petugas | null
  onSaved: () => void
}

export function PetugasFormDialog({ open, onOpenChange, petugas, onSaved }: Props) {
  const [nama, setNama] = useState<string>('')
  const [loket, setLoket] = useState<string>('')
  const [unitKerja, setUnitKerja] = useState<string>('')
  const [foto, setFoto] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>('')
  const [submitting, setSubmitting] = useState<boolean>(false)

  const isEdit = !!petugas

  useEffect(() => {
    if (open) {
      setNama(petugas?.nama ?? '')
      setLoket(petugas?.loket ?? '')
      setUnitKerja(petugas?.unit_kerja ?? '')
      setFoto(null)
      setPreview(petugas?.foto_url ?? '')
    }
  }, [open, petugas])

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFoto(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!isEdit && !foto) {
      toast.error('Foto wajib diunggah')
      return
    }
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('nama', nama)
      formData.append('loket', loket)
      formData.append('unit_kerja', unitKerja)
      if (foto) formData.append('foto', foto)

      if (isEdit && petugas) {
        await updatePetugas(petugas.id, formData)
        toast.success('Petugas berhasil diperbarui')
      } else {
        await createPetugas(formData)
        toast.success('Petugas berhasil ditambahkan')
      }

      onSaved()
      onOpenChange(false)
    } catch {
      toast.error(isEdit ? 'Gagal memperbarui petugas' : 'Gagal menambahkan petugas')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Petugas' : 'Tambah Petugas'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nama">Nama</Label>
            <Input id="nama" value={nama} onChange={(e) => setNama(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="loket">Loket</Label>
            <Input id="loket" value={loket} onChange={(e) => setLoket(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unit_kerja">Unit Kerja</Label>
            <Input
              id="unit_kerja"
              value={unitKerja}
              onChange={(e) => setUnitKerja(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="foto">Foto {isEdit && '(opsional)'}</Label>
            <Input id="foto" type="file" accept="image/jpeg,image/png" onChange={handleFile} />
            {preview && (
              <img
                src={preview}
                alt="preview"
                className="size-24 rounded-md object-cover"
              />
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 4: Implement QrCodeDialog**

Create `frontend/src/components/petugas/QrCodeDialog.tsx`:

```tsx
import { useRef } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Petugas } from '@/types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  petugas: Petugas | null
}

export function QrCodeDialog({ open, onOpenChange, petugas }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  if (!petugas) return null

  const surveyUrl = `${window.location.origin}/survey/${petugas.id}`

  const handleDownload = () => {
    const canvas = containerRef.current?.querySelector('canvas')
    if (!canvas) return
    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = `qr-${petugas.nama.replace(/\s+/g, '-').toLowerCase()}.png`
    link.click()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>QR Code — {petugas.nama}</DialogTitle>
        </DialogHeader>
        <div ref={containerRef} className="flex flex-col items-center gap-4">
          <QRCodeCanvas value={surveyUrl} size={256} includeMargin />
          <p className="text-center text-sm text-muted-foreground">{surveyUrl}</p>
          <Button onClick={handleDownload}>
            <Download className="mr-2 size-4" />
            Unduh PNG
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 5: Implement PetugasPage**

Overwrite `frontend/src/pages/PetugasPage.tsx`:

```tsx
import { useCallback, useEffect, useState } from 'react'
import { MoreHorizontal, Plus, QrCode } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PetugasFormDialog } from '@/components/petugas/PetugasFormDialog'
import { QrCodeDialog } from '@/components/petugas/QrCodeDialog'
import { deletePetugas, getAdminPetugas } from '@/lib/api'
import type { Petugas } from '@/types'

export default function PetugasPage() {
  const [petugas, setPetugas] = useState<Petugas[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [formOpen, setFormOpen] = useState<boolean>(false)
  const [editTarget, setEditTarget] = useState<Petugas | null>(null)
  const [qrTarget, setQrTarget] = useState<Petugas | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Petugas | null>(null)

  const fetchPetugas = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAdminPetugas()
      setPetugas(data)
    } catch {
      toast.error('Gagal memuat daftar petugas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPetugas()
  }, [fetchPetugas])

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deletePetugas(deleteTarget.id)
      toast.success('Petugas berhasil dinonaktifkan')
      setDeleteTarget(null)
      fetchPetugas()
    } catch {
      toast.error('Gagal menonaktifkan petugas')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Daftar Petugas</h1>
        <Button
          onClick={() => {
            setEditTarget(null)
            setFormOpen(true)
          }}
        >
          <Plus className="mr-2 size-4" />
          Tambah Petugas
        </Button>
      </div>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Loket</TableHead>
              <TableHead>Unit Kerja</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {petugas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Belum ada petugas.
                </TableCell>
              </TableRow>
            ) : (
              petugas.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="size-8">
                        <AvatarImage src={p.foto_url} alt={p.nama} />
                        <AvatarFallback>{p.nama.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span>{p.nama}</span>
                    </div>
                  </TableCell>
                  <TableCell>{p.loket}</TableCell>
                  <TableCell>{p.unit_kerja}</TableCell>
                  <TableCell>
                    {p.is_active ? (
                      <Badge>Aktif</Badge>
                    ) : (
                      <Badge variant="secondary">Non-aktif</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditTarget(p)
                            setFormOpen(true)
                          }}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setQrTarget(p)}>
                          <QrCode className="mr-2 size-4" />
                          Lihat QR
                        </DropdownMenuItem>
                        {p.is_active === 1 && (
                          <DropdownMenuItem
                            onClick={() => setDeleteTarget(p)}
                            className="text-destructive"
                          >
                            Nonaktifkan
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      <PetugasFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        petugas={editTarget}
        onSaved={fetchPetugas}
      />

      <QrCodeDialog open={!!qrTarget} onOpenChange={(o) => !o && setQrTarget(null)} petugas={qrTarget} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nonaktifkan petugas?</AlertDialogTitle>
            <AlertDialogDescription>
              Petugas <strong>{deleteTarget?.nama}</strong> akan dinonaktifkan. Data survei tetap tersimpan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Nonaktifkan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
```

- [ ] **Step 6: Jalankan test, verifikasi GREEN**

```bash
npm test src/pages/PetugasPage 2>&1 | tail -10
```

Expected: All tests PASS.

- [ ] **Step 7: Verifikasi build penuh**

```bash
npm run build 2>&1 | tail -10
npm test 2>&1 | tail -15
```

Expected: build success, semua test (smoke + useAuth + StarRating + 4 page tests) PASS.

- [ ] **Step 8: Commit**

```bash
cd /home/moohard/dev/project/survey-petugas
git add frontend/src/components/petugas/ frontend/src/pages/PetugasPage.tsx frontend/src/pages/PetugasPage.test.tsx
git commit -m "feat: implement PetugasPage CRUD dengan dialog form, QR code dialog, dan tests"
```

---

## Phase 6: Integration & E2E (Task 19-20)

### Task 19: CORS Config + SPA Fallback dengan TDD

**Files:**
- Modify: `app/Config/Cors.php`
- Modify: `app/Config/Filters.php`
- Modify: `public/.htaccess`
- Create: `tests/Filters/CorsFilterTest.php`

- [ ] **Step 1: Tulis test CORS preflight (RED)**

Create `tests/Filters/CorsFilterTest.php`:

```php
<?php

namespace Tests\Filters;

use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;
use CodeIgniter\Test\FeatureTestTrait;

/**
 * @internal
 */
final class CorsFilterTest extends CIUnitTestCase
{
    use DatabaseTestTrait;
    use FeatureTestTrait;

    protected $migrate   = true;
    protected $refresh   = true;
    protected $seed      = 'App\Database\Seeds\DatabaseSeeder';
    protected $namespace = 'App';

    public function testPreflightOptionsTidakMembutuhkanJwt(): void
    {
        $result = $this->withHeaders([
            'Origin'                         => 'http://localhost:5173',
            'Access-Control-Request-Method'  => 'GET',
            'Access-Control-Request-Headers' => 'Authorization',
        ])->call('options', '/api/admin/petugas');

        // CORS filter harus respond preflight tanpa hit JwtFilter (yang akan return 401)
        $this->assertNotSame(401, $result->getStatusCode());
        $result->assertHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
    }

    public function testRequestNonOptionsTanpaTokenTetap401(): void
    {
        $result = $this->withHeaders(['Origin' => 'http://localhost:5173'])
            ->call('get', '/api/admin/petugas');

        $result->assertStatus(401);
    }
}
```

- [ ] **Step 2: Jalankan test, verifikasi RED**

```bash
vendor/bin/phpunit tests/Filters/CorsFilterTest.php 2>&1 | tail -10
```

Expected: FAIL — CORS filter belum aktif untuk /api.

- [ ] **Step 3: Konfigurasi CORS untuk development**

Edit `app/Config/Cors.php` — ubah array `$default` menjadi:

```php
    public array $default = [
        'allowedOrigins'         => ['http://localhost:5173'],
        'allowedOriginsPatterns' => [],
        'supportsCredentials'    => false,
        'allowedHeaders'         => ['Content-Type', 'Authorization', 'X-Requested-With'],
        'exposedHeaders'         => [],
        'allowedMethods'         => ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        'maxAge'                 => 7200,
    ];
```

- [ ] **Step 4: Aktifkan CORS filter pada route /api**

Edit `app/Config/Filters.php` — cari property `public array $filters` (default CI4 4.x kosong atau dengan komentar `honeypot`). Replace seluruh property menjadi:

```php
    public array $filters = [
        'cors' => ['before' => ['api/*'], 'after' => ['api/*']],
    ];
```

> Catatan: Jika project sudah pernah custom property `$filters` dengan entry lain (cek dulu file aslinya), merge entry `'cors'` ke array yang ada. Untuk project ini (default CI4 fresh install) langsung replace dengan blok di atas aman.

- [ ] **Step 5: Jalankan test CORS, verifikasi GREEN**

```bash
vendor/bin/phpunit tests/Filters/CorsFilterTest.php 2>&1 | tail -10
```

Expected: `OK (2 tests, ...)`.

- [ ] **Step 6: Update `.htaccess` untuk SPA fallback**

Replace seluruh konten `public/.htaccess` dengan:

```apache
# Disable directory browsing
Options -Indexes

<IfModule mod_rewrite.c>
    Options +FollowSymlinks
    RewriteEngine On

    # Redirect Trailing Slashes (kecuali direktori)
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} (.+)/$
    RewriteRule ^ %1 [L,R=301]

    # API → CodeIgniter front controller
    RewriteCond %{REQUEST_URI} ^/api/
    RewriteRule ^(.*)$ index.php/$1 [L,QSA]

    # SPA fallback: jika file/dir tidak ada DAN bukan route /api,
    # serve React app dari /app/index.html
    RewriteCond %{REQUEST_URI} !^/api/
    RewriteCond %{REQUEST_URI} !^/app/
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ /app/index.html [L]

    # Pastikan request ke direktori app/ tetap di-serve dari sana
    RewriteCond %{REQUEST_URI} ^/app/
    RewriteCond %{REQUEST_FILENAME} -f
    RewriteRule ^ - [L]

    # Default CI4 fallback untuk route non-API yang tidak ditemukan
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^([\s\S]*)$ index.php/$1 [L,NC,QSA]

    # Pertahankan Authorization header
    RewriteCond %{HTTP:Authorization} .
    RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]
</IfModule>
```

- [ ] **Step 7: Smoke test CORS development**

```bash
php spark serve > /tmp/ci4.log 2>&1 &
SERVE_PID=$!
sleep 2

# Verifikasi CORS preflight OPTIONS
curl -s -X OPTIONS http://localhost:8080/api/petugas/1 \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: GET" \
  -i | head -15

kill $SERVE_PID 2>/dev/null
```

Expected: header `Access-Control-Allow-Origin: http://localhost:5173` muncul.

- [ ] **Step 8: Commit**

```bash
git add app/Config/Cors.php app/Config/Filters.php public/.htaccess tests/Filters/
git commit -m "feat: konfigurasi CORS dengan tests, JWT bypass untuk preflight, dan SPA fallback"
```

---

### Task 20: End-to-End Verification

- [ ] **Step 1: Jalankan seluruh test backend & frontend**

```bash
cd /home/moohard/dev/project/survey-petugas
vendor/bin/phpunit --testdox 2>&1 | tail -30

cd frontend
npm test 2>&1 | tail -20
```

Expected: semua test PASS di kedua sisi.

- [ ] **Step 2: Build frontend untuk produksi**

```bash
cd /home/moohard/dev/project/survey-petugas/frontend
npm run build 2>&1 | tail -10
ls ../public/app/
```

Expected: build sukses, `public/app/index.html` dan asset terbentuk.

- [ ] **Step 3: Manual smoke test alur survei (development mode)**

Jalankan kedua server (gunakan dua terminal terpisah):

```bash
# Terminal 1
cd /home/moohard/dev/project/survey-petugas && php spark serve

# Terminal 2
cd /home/moohard/dev/project/survey-petugas/frontend && npm run dev
```

Buka browser dan verifikasi:

- [ ] Buka `http://localhost:5173/survey/1` — petugas Budi Santoso muncul, foto ter-load
- [ ] Klik 5 bintang untuk semua 4 aspek, isi saran "Test E2E"
- [ ] Klik "Kirim Penilaian" — confetti muncul, toast sukses, halaman reset 3 detik
- [ ] Buka `http://localhost:5173/login` — form login muncul
- [ ] Login dengan `admin` / `admin123` — redirect ke dashboard
- [ ] Verifikasi dashboard menampilkan total responden ≥ 1, IKM 100, chart radar dan bar terisi
- [ ] Klik "Ekspor Excel" — file `laporan-ikm-*.xlsx` terunduh
- [ ] Buka tab Petugas — daftar 3 petugas muncul
- [ ] Klik "Tambah Petugas" — isi form, upload foto, simpan — petugas baru muncul di tabel
- [ ] Klik dropdown petugas baru → "Lihat QR" — QR code muncul, klik unduh PNG berhasil
- [ ] Klik dropdown petugas baru → "Edit" — ubah nama, simpan — perubahan terlihat
- [ ] Klik dropdown petugas baru → "Nonaktifkan" — konfirmasi → status berubah ke Non-aktif

- [ ] **Step 4: Manual smoke test production build**

```bash
cd /home/moohard/dev/project/survey-petugas
php spark serve
```

Buka `http://localhost:8080/app/` di browser — verifikasi:

- [ ] React SPA ter-load dari `/app/`
- [ ] Buka `http://localhost:8080/app/survey/1` — halaman survey muncul (SPA fallback bekerja)
- [ ] API call dari `/app` ke `/api/petugas/1` berhasil tanpa CORS error (origin sama)

- [ ] **Step 5: Final commit & dokumentasi**

```bash
git add -A
git commit -m "chore: complete Survei PTSP v1.0 — backend API + React frontend dengan TDD penuh"
```

- [ ] **Step 6: Tampilkan ringkasan akhir ke user**

Jalankan ringkasan:

```bash
echo "=== Test Coverage ==="
vendor/bin/phpunit --testdox 2>&1 | grep -E "(Tests:|OK)"
cd frontend && npm test 2>&1 | grep -E "(Tests|passed)"
echo "=== File Inventory ==="
find app/Controllers/Api app/Models app/Libraries app/Filters app/Services app/Database -type f | wc -l
find frontend/src -type f \( -name "*.ts" -o -name "*.tsx" \) | wc -l
```

Expected: Backend 30+ tests, Frontend 15+ tests, kedua-duanya PASS. Lapor ke user dengan link akses dan kredensial admin default.

---

## Self-Review Notes

Plan ini sudah:

1. ✅ **TDD penuh** — Setiap task implementasi punya tests yang ditulis dulu (RED) sebelum implementasi (GREEN), dengan langkah verifikasi RED dan GREEN eksplisit.
2. ✅ **No placeholders** — Semua step yang berubah kode menyertakan kode lengkap. Tidak ada "lihat spec" atau "implementasi serupa".
3. ✅ **Type & route consistency** — `foto_url` selalu `/api/uploads/{filename}`, route `petugas/{id}/qrcode` dihapus karena QR di-generate client-side via `qrcode.react`, method spoofing dipakai untuk PUT+multipart secara konsisten antara backend (CI4) dan frontend (FormData append `_method=PUT`).
4. ✅ **Idempotent setup** — Step yang menyentuh state existing (`.env`, database) ditulis dengan guard agar tidak merusak state yang sudah ada.
5. ✅ **Backend service registry** — `JwtAuth` service singleton menggantikan dynamic property assignment untuk menyimpan payload JWT.
6. ✅ **N+1 fix** — `SurveiModel::getRekapByDateRange` menggunakan single `whereIn` untuk fetch semua petugas terkait.
7. ✅ **Process kill reliable** — Smoke test menggunakan PID variable, bukan `kill %1`.
8. ✅ **Verifikasi end-to-end** — Task 20 mencakup unit/feature tests + manual smoke test di dev dan production build.
9. ✅ **Tailwind v4 plugin** — Vite config diupdate eksplisit di Task 12 dengan `tailwindcss()` plugin agar CSS Tailwind benar-benar diproses (Tailwind v4 tidak bisa via PostCSS lagi).
10. ✅ **CORS preflight aman** — Task 19 punya test `testPreflightOptionsTidakMembutuhkanJwt` yang memverifikasi OPTIONS request tidak hit JwtFilter.
11. ✅ **Timezone konsisten** — `app.appTimezone = 'Asia/Jakarta'` di `.env` agar PHP `date()` dan MySQL `DATE()` align untuk filter rekap. Frontend `today()` pakai `getFullYear/Month/Date` lokal, bukan `toISOString()` UTC.
12. ✅ **Test selectors stabil** — `ShimmerButton` dipanggil via `data-testid="submit-survey"` agar tidak bergantung accessible-name component pihak ketiga.
13. ✅ **UNIQUE constraint diverifikasi** — Test `testTabelAdminUsernameUnique` query `SHOW INDEX` untuk benar-benar assert UNIQUE, bukan sekadar nama kolom.
14. ✅ **State final eksplisit** — Edit `Filters.php` `$filters` ditampilkan sebagai blok lengkap (replace), bukan instruksi merge ambigu.

**Divergence dari Spec yang disengaja (untuk YAGNI):**

- Spec section 5.3 menyebut `Tabs` & `DatePicker (Calendar+Popover)` — plan pakai layout flat dan native `<input type="date">` untuk minimasi component surface. Bisa di-upgrade nanti tanpa breaking changes.
- Spec section 5.2 menyebut `Form` shadcn (RHF + zod) untuk login — plan pakai `useState` manual karena form login hanya 2 field, tidak butuh schema validation library.
- Spec section 5.4 mention `Spinner` — plan pakai `Skeleton` saja untuk konsistensi loading state.
- Endpoint `GET /api/admin/petugas/{id}/qrcode` di spec dihapus — QR di-generate client-side via `qrcode.react` (lebih responsif, tidak ada round trip).

---

## Execution Handoff

**Plan complete dan tersimpan di `docs/superpowers/plans/2026-04-27-survei-ptsp.md`. Dua opsi eksekusi:**

**1. Subagent-Driven (recommended)** — Saya dispatch subagent baru per task, review antar task, iterasi cepat. Cocok untuk plan besar dengan banyak task TDD seperti ini.

**2. Inline Execution** — Eksekusi task di session ini menggunakan `superpowers:executing-plans`, batch execution dengan checkpoints untuk review.

**Mana yang Anda pilih?**
