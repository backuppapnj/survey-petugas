import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
