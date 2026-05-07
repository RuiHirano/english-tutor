import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { call } from '@/lib/api';
import type { MaterialWithVocab } from '@shared/ipc';

export function MaterialDetail() {
  const { id } = useParams<{ id: string }>();
  const [material, setMaterial] = useState<MaterialWithVocab | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    call('db:material.get', { id: Number(id) })
      .then(setMaterial)
      .catch((e) => setError((e as Error).message));
  }, [id]);

  if (error) return <p className="text-destructive">{error}</p>;
  if (!material) return <p className="text-muted-foreground">読み込み中…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{material.title}</h2>
        <p className="text-muted-foreground">
          習熟度 {material.mastery_level} / 学習回数 {material.total_appearances}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>スクリプト</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap text-sm">{material.script}</pre>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>語彙・文法・表現 ({material.vocabulary_items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="py-1">type</th>
                <th className="py-1">term</th>
                <th className="py-1">meaning</th>
                <th className="py-1">習熟度</th>
                <th className="py-1">出現回数</th>
              </tr>
            </thead>
            <tbody>
              {material.vocabulary_items.map((v) => (
                <tr key={v.id} className="border-t">
                  <td className="py-1">{v.type}</td>
                  <td className="py-1 font-medium">{v.term}</td>
                  <td className="py-1">{v.meaning}</td>
                  <td className="py-1">{v.mastery_level}</td>
                  <td className="py-1">{v.total_appearances}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
