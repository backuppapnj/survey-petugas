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

    public function testInsertMenghasilkanSurveyTokenUnik16HexChar(): void
    {
        $model = new \App\Models\PetugasModel();
        $id    = $model->insert(['nama' => 'Tester', 'loket' => 'Loket X', 'unit_kerja' => 'Unit X']);
        $row   = $model->find($id);

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

        $model->update($id, ['is_active' => 0]);
        $this->assertNull($model->getActiveByToken((string) $token));

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
        $this->assertNull($model->regenerateToken(999999));
    }
}
