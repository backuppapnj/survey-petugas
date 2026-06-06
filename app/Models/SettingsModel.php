<?php

namespace App\Models;

use CodeIgniter\Model;

/**
 * Model untuk tabel `settings` (key-value).
 *
 * Menyediakan helper untuk membaca/menulis pengaturan dengan casting tipe
 * otomatis (string|int|bool|float|json) sehingga consumer tidak perlu
 * melakukan konversi manual. Nilai default dikelola di SettingsSeeder.
 */
class SettingsModel extends Model
{
    protected $table         = 'settings';
    protected $primaryKey    = 'key';
    protected $allowedFields = ['key', 'value', 'type', 'category', 'label', 'is_public'];
    protected $returnType    = 'array';
    protected $useTimestamps = false;

    /**
     * Ambil seluruh pengaturan sebagai array asosiatif key => value (sudah di-cast).
     *
     * @param bool $onlyPublic Jika true, hanya kembalikan pengaturan publik.
     *
     * @return array<string, mixed>
     */
    public function getAllCast(bool $onlyPublic = false): array
    {
        $builder = $this;
        if ($onlyPublic) {
            $builder = $this->where('is_public', 1);
        }

        $rows   = $builder->findAll();
        $result = [];
        foreach ($rows as $row) {
            $result[$row['key']] = $this->castValue($row['value'], $row['type']);
        }

        return $result;
    }

    /**
     * Ambil seluruh pengaturan lengkap dengan metadata (untuk UI admin).
     *
     * @return list<array<string, mixed>>
     */
    public function getAllWithMeta(): array
    {
        $rows = $this->orderBy('category', 'ASC')->orderBy('key', 'ASC')->findAll();

        return array_map(function ($row) {
            return [
                'key'       => $row['key'],
                'value'     => $this->castValue($row['value'], $row['type']),
                'type'      => $row['type'],
                'category'  => $row['category'],
                'label'     => $row['label'],
                'is_public' => (bool) $row['is_public'],
            ];
        }, $rows);
    }

    /**
     * Ambil satu nilai pengaturan dengan casting; kembalikan $default jika tidak ada.
     */
    public function get(string $key, mixed $default = null): mixed
    {
        $row = $this->find($key);
        if ($row === null) {
            return $default;
        }

        return $this->castValue($row['value'], $row['type']);
    }

    /**
     * Simpan/perbarui beberapa pengaturan sekaligus. Hanya key yang sudah ada
     * (terdaftar di seeder) yang diperbarui — key tak dikenal diabaikan agar
     * tidak ada pengaturan liar yang masuk dari klien.
     *
     * @param array<string, mixed> $pairs
     *
     * @return list<string> Daftar key yang berhasil diperbarui.
     */
    public function updateMany(array $pairs): array
    {
        $updated = [];
        foreach ($pairs as $key => $value) {
            $row = $this->find($key);
            if ($row === null) {
                continue;
            }

            $this->update($key, [
                'value' => $this->serializeValue($value, $row['type']),
            ]);
            $updated[] = $key;
        }

        return $updated;
    }

    /**
     * Konversi nilai mentah (string dari DB) ke tipe PHP sesuai $type.
     */
    private function castValue(?string $raw, string $type): mixed
    {
        if ($raw === null) {
            return null;
        }

        return match ($type) {
            'int'   => (int) $raw,
            'float' => (float) $raw,
            'bool'  => filter_var($raw, FILTER_VALIDATE_BOOLEAN),
            'json'  => json_decode($raw, true),
            default => $raw,
        };
    }

    /**
     * Konversi nilai PHP ke string untuk disimpan ke DB sesuai $type.
     */
    private function serializeValue(mixed $value, string $type): string
    {
        return match ($type) {
            'bool'  => $value ? '1' : '0',
            'json'  => json_encode($value, JSON_UNESCAPED_UNICODE),
            default => (string) $value,
        };
    }
}
