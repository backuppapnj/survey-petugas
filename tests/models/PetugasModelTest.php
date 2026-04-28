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
