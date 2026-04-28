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
