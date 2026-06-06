# Token Statis untuk URL Survei — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengganti `petugas_id` mentah di URL survei publik dengan token statis acak 16-char, agar ID tidak bisa dienumerasi; lengkap dengan fitur regenerate token oleh admin.

**Architecture:** Tambah kolom `survey_token` (unik) di tabel `petugas`, di-generate otomatis saat insert. Endpoint publik (GET petugas, POST survei) memakai token; endpoint admin tetap by id. `petugas_id` tetap PK/FK internal. Frontend URL & QR memakai token.

**Tech Stack:** CodeIgniter 4 + PHPUnit; React 19 + TypeScript + Vitest.

**Spec:** `docs/superpowers/specs/2026-06-06-token-survey-design.md`

---

## File Structure

**Backend:**
- Create: `app/Database/Migrations/2026-06-06-000001_AddSurveyTokenToPetugas.php`
- Modify: `app/Models/PetugasModel.php` (generate token, `getActiveByToken`, `regenerateToken`)
- Modify: `app/Controllers/Api/PetugasController.php` (`show` by token, `serialize` token, `regenerateToken`)
- Modify: `app/Controllers/Api/SurveiController.php` (`submit` by token)
- Modify: `app/Config/Routes.php`
- Tests: `tests/models/PetugasModelTest.php`, `tests/controllers/api/PetugasControllerTest.php`, `tests/controllers/api/SurveiControllerTest.php`

**Frontend (from `frontend/`):**
- Modify: `src/types/index.ts`, `src/lib/api.ts`, `src/App.tsx`, `src/pages/SurveyPage.tsx`, `src/components/petugas/QrCodeDialog.tsx`, `src/pages/PetugasPage.tsx`
- Tests: `src/pages/SurveyPage.test.tsx`, `src/components/petugas/QrCodeDialog.test.tsx`

---

## FASE A — BACKEND

### Task A1: Migration kolom survey_token + backfill

**Files:** Create `app/Database/Migrations/2026-06-06-000001_AddSurveyTokenToPetugas.php`

- [ ] **Step 1: Tulis migration**

```php
<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddSurveyTokenToPetugas extends Migration
{
    public function up()
    {
        // 1. Tambah kolom nullable dulu agar bisa di-backfill.
        $this->forge->addColumn('petugas', [
            'survey_token' => [
                'type'       => 'VARCHAR',
                'constraint' => 32,
                'null'       => true,
                'after'      => 'unit_kerja',
            ],
        ]);

        // 2. Backfill token acak unik untuk petugas yang sudah ada.
        $rows = $this->db->table('petugas')->select('id')->get()->getResultArray();
        foreach ($rows as $row) {
            $this->db->table('petugas')
                ->where('id', $row['id'])
                ->update(['survey_token' => bin2hex(random_bytes(8))]);
        }

        // 3. Jadikan NOT NULL + unik.
        $this->forge->modifyColumn('petugas', [
            'survey_token' => [
                'type'       => 'VARCHAR',
                'constraint' => 32,
                'null'       => false,
            ],
        ]);
        $this->db->query('ALTER TABLE petugas ADD UNIQUE (survey_token)');
    }

    public function down()
    {
        $this->forge->dropColumn('petugas', 'survey_token');
    }
}
```

- [ ] **Step 2: Jalankan migration di DB test (verifikasi tanpa error)**

Run: `vendor/bin/phpunit tests/database/MigrationTest.php --no-coverage` (atau test apa pun ber-DatabaseTestTrait yang memicu migrate)
Expected: PASS (migrasi jalan tanpa error). Jika tidak ada test memicu, lanjut ke A2 yang test-nya memicu migrate.

- [ ] **Step 3: Commit**

```bash
git add app/Database/Migrations/2026-06-06-000001_AddSurveyTokenToPetugas.php
git commit -m "feat(petugas): migration kolom survey_token (unik) + backfill"
```

---

### Task A2: PetugasModel — generate token, lookup, regenerate

**Files:** Modify `app/Models/PetugasModel.php`; Test `tests/models/PetugasModelTest.php`

- [ ] **Step 1: Tulis test (RED)**

Tambahkan ke `tests/models/PetugasModelTest.php` (di dalam class; asumsikan trait DB + seed DatabaseSeeder seperti test lain — bila berbeda, ikuti pola file):

```php
    public function testInsertMenghasilkanSurveyTokenUnik16HexChar(): void
    {
        $model = new \App\Models\PetugasModel();
        $id    = $model->insert([
            'nama' => 'Tester', 'loket' => 'Loket X', 'unit_kerja' => 'Unit X',
        ]);
        $row = $model->find($id);

        $this->assertArrayHasKey('survey_token', $row);
        $this->assertMatchesRegularExpression('/^[0-9a-f]{16}$/', (string) $row['survey_token']);
    }

    public function testGetActiveByTokenMengembalikanPetugasAktif(): void
    {
        $model = new \App\Models\PetugasModel();
        $id    = $model->insert(['nama' => 'A', 'loket' => 'L', 'unit_kerja' => 'U']);
        $token = $model->find($id)['survey_token'];

        $found = $model->getActiveByToken((string) $token);
        $this->assertNotNull($found);
        $this->assertSame($id, (int) $found['id']);

        // Non-aktif -> null
        $model->update($id, ['is_active' => 0]);
        $this->assertNull($model->getActiveByToken((string) $token));

        // Token asal -> null
        $this->assertNull($model->getActiveByToken('tokentidakada00'));
    }

    public function testRegenerateTokenMenghasilkanTokenBaru(): void
    {
        $model = new \App\Models\PetugasModel();
        $id    = $model->insert(['nama' => 'B', 'loket' => 'L', 'unit_kerja' => 'U']);
        $lama  = $model->find($id)['survey_token'];

        $baru = $model->regenerateToken($id);

        $this->assertNotNull($baru);
        $this->assertNotSame($lama, $baru);
        $this->assertMatchesRegularExpression('/^[0-9a-f]{16}$/', (string) $baru);
        $this->assertSame($baru, $model->find($id)['survey_token']);
        $this->assertNull($model->regenerateToken(999999)); // id tidak ada
    }
```

- [ ] **Step 2: Jalankan test, verifikasi gagal**

Run: `vendor/bin/phpunit tests/models/PetugasModelTest.php --no-coverage`
Expected: FAIL (`survey_token` belum ter-generate; `getActiveByToken`/`regenerateToken` belum ada).

- [ ] **Step 3: Implementasi di PetugasModel.php (GREEN)**

Tambah callback & method. Ubah deklarasi `$beforeInsert` (tambahkan jika belum ada) dan tambah method:

```php
    protected $beforeInsert = ['generateSurveyToken'];

    /**
     * Set survey_token acak unik saat insert bila belum ada.
     * Token di-generate sistem (bukan input admin), ditambahkan di sini
     * setelah filter allowedFields sehingga tetap masuk ke query insert.
     */
    protected function generateSurveyToken(array $data): array
    {
        if (empty($data['data']['survey_token'])) {
            $data['data']['survey_token'] = $this->generateUniqueToken();
        }
        return $data;
    }

    /**
     * Hasilkan token 16-char hex yang unik di tabel petugas.
     */
    public function generateUniqueToken(): string
    {
        do {
            $token = bin2hex(random_bytes(8));
        } while ($this->where('survey_token', $token)->first() !== null);

        return $token;
    }

    /**
     * Petugas aktif berdasarkan survey_token (untuk URL/survey publik).
     */
    public function getActiveByToken(string $token): ?array
    {
        return $this->where('is_active', 1)->where('survey_token', $token)->first();
    }

    /**
     * Buat ulang token petugas (mematikan QR lama). Update kolom langsung
     * via Query Builder agar tidak bergantung pada allowedFields.
     * Mengembalikan token baru, atau null bila petugas tidak ada.
     */
    public function regenerateToken(int $id): ?string
    {
        if ($this->find($id) === null) {
            return null;
        }
        $token = $this->generateUniqueToken();
        $this->builder()->where('id', $id)->update(['survey_token' => $token]);

        return $token;
    }
```

- [ ] **Step 4: Jalankan test, verifikasi lulus**

Run: `vendor/bin/phpunit tests/models/PetugasModelTest.php --no-coverage`
Expected: PASS.
> Bila `survey_token` tetap kosong saat insert (perilaku allowedFields berbeda), tambahkan `'survey_token'` ke `$allowedFields` sebagai fallback (controller tetap tidak meneruskannya dari input user, sama seperti pola `is_active`). Jalankan ulang hingga hijau.

- [ ] **Step 5: Commit**

```bash
git add app/Models/PetugasModel.php tests/models/PetugasModelTest.php
git commit -m "feat(petugas): auto-generate survey_token + getActiveByToken + regenerateToken"
```

---

### Task A3: PetugasController — show by token, serialize token, regenerate + routes

**Files:** Modify `app/Controllers/Api/PetugasController.php`, `app/Config/Routes.php`; Test `tests/controllers/api/PetugasControllerTest.php`

- [ ] **Step 1: Tulis test (RED)**

Tambahkan ke `tests/controllers/api/PetugasControllerTest.php` (ikuti pola auth/JWT file tsb; `JwtLibrary` dipakai test lain):

```php
    public function testShowPublikMemakaiToken(): void
    {
        $model = new \App\Models\PetugasModel();
        $token = $model->find(1)['survey_token'];

        $ok = $this->call('get', "/api/petugas/{$token}");
        $ok->assertStatus(200);
        $body = json_decode($ok->getJSON(), true);
        $this->assertSame(1, $body['id']);

        // Id mentah / token asal -> 404
        $this->call('get', '/api/petugas/999999')->assertStatus(404);
    }

    public function testRegenerateTokenButuhAuthDanMengubahToken(): void
    {
        $model = new \App\Models\PetugasModel();
        $lama  = $model->find(1)['survey_token'];

        // Tanpa JWT -> 401
        $this->call('post', '/api/admin/petugas/1/regenerate-token')->assertStatus(401);

        $token   = (new \App\Libraries\JwtLibrary())->encode(['admin_id' => 1, 'username' => 'admin']);
        $res     = $this->withHeaders(['Authorization' => 'Bearer ' . $token])
            ->call('post', '/api/admin/petugas/1/regenerate-token');
        $res->assertStatus(200);

        $baru = json_decode($res->getJSON(), true)['survey_token'];
        $this->assertNotSame($lama, $baru);
        $this->assertSame($baru, $model->find(1)['survey_token']);
    }
```

- [ ] **Step 2: Jalankan test, verifikasi gagal**

Run: `vendor/bin/phpunit tests/controllers/api/PetugasControllerTest.php --no-coverage`
Expected: FAIL (route token belum ada; `show` masih by id; `regenerateToken` belum ada).

- [ ] **Step 3: Ubah Routes.php (GREEN bagian 1)**

Di `app/Config/Routes.php`:
- Ganti baris publik `$routes->get('petugas/(:num)', 'PetugasController::show/$1');` menjadi:
```php
    $routes->get('petugas/(:segment)', 'PetugasController::show/$1');
```
- Di dalam grup `admin` (filter jwt), tambah (mis. setelah `restore`):
```php
        $routes->post('petugas/(:num)/regenerate-token', 'PetugasController::regenerateToken/$1');
```

- [ ] **Step 4: Ubah PetugasController.php (GREEN bagian 2)**

- Ubah `show()` agar lookup by token:
```php
    /**
     * GET /api/petugas/{token} — public, hanya petugas aktif (by survey_token).
     */
    public function show($token = null): ResponseInterface
    {
        $petugas = $this->petugasModel->getActiveByToken((string) $token);

        if ($petugas === null) {
            return $this->response->setStatusCode(404)->setJSON([
                'status' => 404,
                'error'  => 'Petugas tidak ditemukan',
            ]);
        }

        return $this->response->setJSON($this->serialize($petugas));
    }
```
- Di `serialize()`, sertakan `survey_token` HANYA pada konteks admin (saat `$includeStatus` true), tepat sebelum `if ($includeStatus)` ganti blok menjadi:
```php
        if ($includeStatus) {
            $out['is_active']    = (int) $petugas['is_active'];
            $out['survey_token'] = $petugas['survey_token'] ?? null;
        }
        return $out;
```
- Tambah method `regenerateToken` (sebelum `serialize`):
```php
    /**
     * POST /api/admin/petugas/{id}/regenerate-token — buat ulang token (QR lama mati).
     */
    public function regenerateToken($id = null): ResponseInterface
    {
        $token = $this->petugasModel->regenerateToken((int) $id);

        if ($token === null) {
            return $this->response->setStatusCode(404)->setJSON([
                'status' => 404,
                'error'  => 'Petugas tidak ditemukan',
            ]);
        }

        return $this->response->setJSON(['survey_token' => $token]);
    }
```

- [ ] **Step 5: Jalankan test, verifikasi lulus**

Run: `vendor/bin/phpunit tests/controllers/api/PetugasControllerTest.php --no-coverage`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/Controllers/Api/PetugasController.php app/Config/Routes.php tests/controllers/api/PetugasControllerTest.php
git commit -m "feat(petugas): show by token + endpoint regenerate-token + serialize token"
```

---

### Task A4: SurveiController — submit by token

**Files:** Modify `app/Controllers/Api/SurveiController.php`; Test `tests/controllers/api/SurveiControllerTest.php`

- [ ] **Step 1: Perbarui test (RED)**

Di `tests/controllers/api/SurveiControllerTest.php`:
- Ubah `testSubmitSuksesDenganRatingValid` agar memakai token (ambil token petugas 1):
```php
    public function testSubmitSuksesDenganRatingValid(): void
    {
        $token = (new \App\Models\PetugasModel())->find(1)['survey_token'];

        $result = $this->withBodyFormat('json')->call('post', '/api/survei', [
            'token'      => $token,
            'kecepatan'  => 4,
            'keramahan'  => 3,
            'informasi'  => 4,
            'kenyamanan' => 3,
            'saran'      => 'Mantap',
        ]);

        $result->assertStatus(201);
        $this->assertSame(1, $this->db->table('survei')->countAllResults());
    }
```
- Ubah `testSubmitGagalUntukPetugasNonAktif` agar memakai token petugas 1 (yang dinonaktifkan):
```php
    public function testSubmitGagalUntukPetugasNonAktif(): void
    {
        $token = (new \App\Models\PetugasModel())->find(1)['survey_token'];
        $this->db->table('petugas')->where('id', 1)->update(['is_active' => 0]);

        $result = $this->withBodyFormat('json')->call('post', '/api/survei', [
            'token'      => $token,
            'kecepatan'  => 4, 'keramahan' => 4, 'informasi' => 4, 'kenyamanan' => 4,
        ]);

        $result->assertStatus(422);
    }
```
- Tambah test token asal:
```php
    public function testSubmitGagalTokenTidakDikenal(): void
    {
        $result = $this->withBodyFormat('json')->call('post', '/api/survei', [
            'token'      => 'tokenpalsu000000',
            'kecepatan'  => 4, 'keramahan' => 4, 'informasi' => 4, 'kenyamanan' => 4,
        ]);
        $result->assertStatus(422);
    }
```
- Pada `testSubmitGagalDenganRatingDiluar1Sampai4`, ganti `'petugas_id' => 1` menjadi memakai token valid + nilai 5 (tetap 422 karena rating invalid):
```php
    public function testSubmitGagalDenganRatingDiluar1Sampai4(): void
    {
        $token = (new \App\Models\PetugasModel())->find(1)['survey_token'];
        $result = $this->withBodyFormat('json')->call('post', '/api/survei', [
            'token'      => $token,
            'kecepatan'  => 5, 'keramahan' => 3, 'informasi' => 4, 'kenyamanan' => 3,
        ]);
        $result->assertStatus(422);
    }
```

- [ ] **Step 2: Jalankan test, verifikasi gagal**

Run: `vendor/bin/phpunit tests/controllers/api/SurveiControllerTest.php --no-coverage`
Expected: FAIL (controller masih mengharap `petugas_id`).

- [ ] **Step 3: Ubah SurveiController::submit (GREEN)**

Ganti aturan validasi & resolusi petugas. Aturan:
```php
        $rules = [
            'token'      => 'required|string',
            'kecepatan'  => 'required|integer|greater_than[0]|less_than[5]',
            'keramahan'  => 'required|integer|greater_than[0]|less_than[5]',
            'informasi'  => 'required|integer|greater_than[0]|less_than[5]',
            'kenyamanan' => 'required|integer|greater_than[0]|less_than[5]',
            'saran'      => 'permit_empty|string|max_length[1000]',
        ];
```
Ganti blok resolusi petugas + insert:
```php
        $petugas = (new PetugasModel())->getActiveByToken((string) $json['token']);
        if ($petugas === null) {
            return $this->response->setStatusCode(422)->setJSON([
                'status'   => 422,
                'error'    => 'Validation Error',
                'messages' => ['token' => 'Petugas tidak ditemukan atau tidak aktif'],
            ]);
        }

        (new SurveiModel())->insert([
            'petugas_id' => (int) $petugas['id'],
            'kecepatan'  => (int) $json['kecepatan'],
            'keramahan'  => (int) $json['keramahan'],
            'informasi'  => (int) $json['informasi'],
            'kenyamanan' => (int) $json['kenyamanan'],
            'saran'      => $json['saran'] ?? null,
        ]);
```

- [ ] **Step 4: Jalankan test + seluruh suite backend**

Run: `vendor/bin/phpunit tests/controllers/api/SurveiControllerTest.php --no-coverage` → PASS
Run: `vendor/bin/phpunit --no-coverage` → semua PASS

- [ ] **Step 5: Commit**

```bash
git add app/Controllers/Api/SurveiController.php tests/controllers/api/SurveiControllerTest.php
git commit -m "feat(survei): submit memakai token (bukan petugas_id mentah)"
```

---

## FASE B — FRONTEND (dari direktori `frontend/`)

### Task B1: types + api memakai token

**Files:** Modify `src/types/index.ts`, `src/lib/api.ts`

- [ ] **Step 1: Ubah types** (`src/types/index.ts`)
- Pada interface `Petugas`, tambah field: `survey_token: string`.
- Pada interface `SurveiPayload`, ganti `petugas_id: number` menjadi `token: string`.

- [ ] **Step 2: Ubah api.ts** (`src/lib/api.ts`)
- `getPetugas`:
```ts
export async function getPetugas(token: string): Promise<Petugas> {
  return (await api.get<Petugas>(`/petugas/${token}`)).data
}
```
- Tambah `regenerateToken` (setelah `restorePetugas`):
```ts
export async function regenerateToken(id: number): Promise<{ survey_token: string }> {
  return (await api.post<{ survey_token: string }>(`/admin/petugas/${id}/regenerate-token`)).data
}
```
(`submitSurvei` tidak berubah signature — payload `SurveiPayload` kini berisi `token`.)

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit -p tsconfig.app.json`
Expected: muncul error di pemakai lama (SurveyPage/QrCodeDialog) — akan diperbaiki di B2/B3. Lanjutkan.

- [ ] **Step 4: Commit**

```bash
git add src/types/index.ts src/lib/api.ts
git commit -m "feat(api): getPetugas & submitSurvei pakai token + regenerateToken"
```

---

### Task B2: Router :token + SurveyPage pakai token

**Files:** Modify `src/App.tsx`, `src/pages/SurveyPage.tsx`; Test `src/pages/SurveyPage.test.tsx`

- [ ] **Step 1: Perbarui test SurveyPage (RED)**

Di `src/pages/SurveyPage.test.tsx`: ganti setiap render yang mem-mock rute `/survey/:petugasId`/param `petugasId` agar memakai `token`. Pola umum (sesuaikan dengan struktur test yang ada): jika test memakai `MemoryRouter` dengan `initialEntries={['/survey/3']}` dan route `path="/survey/:petugasId"`, ubah menjadi `path="/survey/:token"` dan entri `['/survey/tok123']`; mock `getPetugas` mengembalikan objek `Petugas` yang kini juga punya `survey_token`. Pastikan asersi pemanggilan `submitSurvei` mengharapkan `token` (bukan `petugas_id`).

- [ ] **Step 2: Jalankan test, verifikasi gagal**

Run: `npx vitest run src/pages/SurveyPage.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Ubah App.tsx**
- Ganti `<Route path="/survey/:petugasId" element={<SurveyPage />} />` menjadi `<Route path="/survey/:token" element={<SurveyPage />} />`.

- [ ] **Step 4: Ubah SurveyPage.tsx**
- `const { token } = useParams<{ token: string }>()` (ganti `petugasId`).
- Efek pemuatan: `if (!token) return; getPetugas(token)...` (ganti `Number(petugasId)`).
- Pada `handleSubmit`, ganti payload `petugas_id: petugas.id` menjadi `token: token` (token dari useParams). Sisakan field nilai seperti adanya.
- Hapus referensi `petugasId`/`Number(...)` yang tersisa.

- [ ] **Step 5: Jalankan test + type-check**

Run: `npx vitest run src/pages/SurveyPage.test.tsx` → PASS
Run: `npx tsc --noEmit -p tsconfig.app.json` → bersih untuk file ini (QrCodeDialog mungkin masih error → B3)

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/pages/SurveyPage.tsx src/pages/SurveyPage.test.tsx
git commit -m "feat(survey): rute & SurveyPage memakai token"
```

---

### Task B3: QrCodeDialog pakai token + tombol regenerate

**Files:** Modify `src/components/petugas/QrCodeDialog.tsx`; Test `src/components/petugas/QrCodeDialog.test.tsx`

- [ ] **Step 1: Perbarui test (RED)**

Di `src/components/petugas/QrCodeDialog.test.tsx`:
- Objek `petugas` uji tambah `survey_token: 'tok123abc'`.
- Ubah asersi URL: nilai QR harus berakhiran `/survey/tok123abc` (bukan `/survey/3`). Pertahankan pola stub `import.meta.env.BASE_URL` yang sudah ada.
- Tambah test tombol regenerate:
```tsx
  it('tombol buat ulang token memunculkan konfirmasi lalu memanggil regenerateToken', async () => {
    const { regenerateToken } = await import('@/lib/api')
    // (di atas file) vi.mock('@/lib/api', () => ({ regenerateToken: vi.fn().mockResolvedValue({ survey_token: 'tokBARU' }) }))
    const onTokenRegenerated = vi.fn()
    render(
      <QrCodeDialog open onOpenChange={() => {}} petugas={petugas} onTokenRegenerated={onTokenRegenerated} />,
    )
    fireEvent.click(screen.getByRole('button', { name: /buat ulang token/i }))
    fireEvent.click(screen.getByRole('button', { name: /^buat ulang$/i })) // konfirmasi AlertDialog
    await waitFor(() => expect(regenerateToken).toHaveBeenCalledWith(3))
    await waitFor(() => expect(onTokenRegenerated).toHaveBeenCalledWith(3, 'tokBARU'))
  })
```
(Tambahkan `vi.mock('@/lib/api', ...)` di atas import komponen, dan import `waitFor`, `fireEvent` dari `@testing-library/react`.)

- [ ] **Step 2: Jalankan test, verifikasi gagal**

Run: `npx vitest run src/components/petugas/QrCodeDialog.test.tsx`
Expected: FAIL (URL masih pakai id; tombol regenerate belum ada).

- [ ] **Step 3: Ubah QrCodeDialog.tsx**
- Tambah prop opsional: `onTokenRegenerated?: (petugasId: number, newToken: string) => void` pada interface `Props`.
- Ganti `surveyUrl` agar memakai token:
```tsx
  const surveyUrl = `${window.location.origin}${import.meta.env.BASE_URL}survey/${petugas.survey_token}`
```
- Tambah state + handler regenerate (di dalam komponen):
```tsx
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false)
  const [regenerating, setRegenerating] = useState<boolean>(false)

  const handleRegenerate = async () => {
    setRegenerating(true)
    try {
      const { survey_token } = await regenerateToken(petugas.id)
      onTokenRegenerated?.(petugas.id, survey_token)
      toast.success('Token diperbarui. Cetak ulang QR; QR lama tidak berlaku lagi.')
      setConfirmOpen(false)
    } catch {
      toast.error('Gagal membuat ulang token')
    } finally {
      setRegenerating(false)
    }
  }
```
- Import: `regenerateToken` dari `@/lib/api`; komponen `AlertDialog` (+ bagian-bagiannya) dari `@/components/ui/alert-dialog`; `RefreshCw` dari `lucide-react`.
- Tambah tombol di area aksi (mis. di bawah tombol Unduh/Cetak):
```tsx
            <Button variant="outline" className="flex-1" onClick={() => setConfirmOpen(true)}>
              <RefreshCw className="mr-2 size-4" />
              Buat ulang token
            </Button>
```
- Tambah AlertDialog konfirmasi (di dalam render, dalam DialogContent):
```tsx
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Buat ulang token QR?</AlertDialogTitle>
                  <AlertDialogDescription>
                    QR lama untuk <strong>{petugas.nama}</strong> tidak akan berlaku lagi dan
                    harus dicetak ulang. Lanjutkan?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRegenerate} disabled={regenerating}>
                    Buat ulang
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
```
(Pastikan `useState` & `toast` sudah/diimpor.)

- [ ] **Step 4: Jalankan test + type-check**

Run: `npx vitest run src/components/petugas/QrCodeDialog.test.tsx` → PASS
Run: `npx tsc --noEmit -p tsconfig.app.json` → bersih

- [ ] **Step 5: Commit**

```bash
git add src/components/petugas/QrCodeDialog.tsx src/components/petugas/QrCodeDialog.test.tsx
git commit -m "feat(qr): URL pakai token + tombol buat ulang token (konfirmasi)"
```

---

### Task B4: PetugasPage — sambungkan onTokenRegenerated

**Files:** Modify `src/pages/PetugasPage.tsx`

- [ ] **Step 1: Tambah handler + teruskan prop**
- Tambah handler (di dalam komponen):
```tsx
  const handleTokenRegenerated = (id: number, newToken: string) => {
    setPetugas((prev) => prev.map((p) => (p.id === id ? { ...p, survey_token: newToken } : p)))
    setQrTarget((prev) => (prev && prev.id === id ? { ...prev, survey_token: newToken } : prev))
  }
```
- Teruskan ke dialog:
```tsx
      <QrCodeDialog
        open={!!qrTarget}
        onOpenChange={(o) => !o && setQrTarget(null)}
        petugas={qrTarget}
        onTokenRegenerated={handleTokenRegenerated}
      />
```

- [ ] **Step 2: Type-check + full suite**

Run: `npx tsc --noEmit -p tsconfig.app.json` → bersih
Run: `npx vitest run` → semua PASS

- [ ] **Step 3: Commit**

```bash
git add src/pages/PetugasPage.tsx
git commit -m "feat(petugas): perbarui token di state saat regenerate dari QR dialog"
```

---

## FASE C — VERIFIKASI

### Task C1: Regresi penuh + build + sapu sisa id-URL

- [ ] **Step 1: Backend penuh**

Run: `vendor/bin/phpunit --no-coverage` → semua PASS

- [ ] **Step 2: Frontend penuh + type-check + build**

Run (dari `frontend/`): `npx vitest run` → PASS; `npx tsc --noEmit -p tsconfig.app.json` → bersih; `npm run build` → sukses

- [ ] **Step 3: Sapu sisa pemakaian id di URL/alur publik**

Run (dari root): `grep -rn -E "petugas_id|/survey/\$\{?[^}]*\.id|getPetugas\(.*\.id" frontend/src app | grep -v "\.test\." | grep -v "petugas_id.*survei"`
Periksa hasil: pastikan tidak ada lagi konstruksi URL survei atau pemanggilan getPetugas yang memakai `petugas.id` (harus pakai token). (Catatan: `petugas_id` pada tabel/model survei adalah benar — itu FK internal, bukan URL.)

- [ ] **Step 4: Commit (bila ada perbaikan)**

```bash
git add -A && git commit -m "test(token): bersihkan sisa pemakaian id pada alur publik"
```

---

## Self-Review (diisi penulis plan)
- Cakupan spec: migrasi (A1), model token+lookup+regenerate (A2), show by token + regenerate endpoint + serialize (A3), submit by token (A4), types+api (B1), router+SurveyPage (B2), QR+regenerate UI (B3), PetugasPage integrasi (B4), verifikasi+build (C1). ✓
- Acceptance #1–#8 spec → tercakup A1–C1. ✓
- Konsistensi nama: `survey_token` (DB/model/serialize/types), `getActiveByToken`, `regenerateToken`, `onTokenRegenerated`, `token` (payload) — konsisten lintas task. ✓
