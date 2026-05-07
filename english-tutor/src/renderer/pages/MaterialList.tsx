import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { call } from '@/lib/api';
import type { Material } from '@shared/types';

export function MaterialList() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    call('db:material.list', { activeOnly: false })
      .then(setMaterials)
      .catch((e) => setError((e as Error).message));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">教材</h2>
        <p className="text-muted-foreground">これまでに生成・学習した教材</p>
      </div>
      {error && <p className="text-destructive">{error}</p>}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {materials.map((m) => (
          <Link key={m.id} to={`/materials/${m.id}`}>
            <Card className="transition-colors hover:bg-accent">
              <CardHeader>
                <CardTitle className="text-lg">{m.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  習熟度 {m.mastery_level} / 学習回数 {m.total_appearances}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  最終: {m.last_appeared_at ?? '未学習'}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
        {materials.length === 0 && !error && (
          <p className="text-muted-foreground">教材がまだありません。</p>
        )}
      </div>
    </div>
  );
}
