import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { call } from '@/lib/api';
import type { VocabDue } from '@shared/types';

export function VocabList() {
  const [items, setItems] = useState<VocabDue[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    call('db:vocab.due', { limit: 200 })
      .then(setItems)
      .catch((e) => setError((e as Error).message));
  }, []);

  if (error) return <p className="text-destructive">{error}</p>;

  const learned = items.filter((i) => (i.total_appearances ?? 0) > 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">学んだ単語</h2>
        <p className="text-muted-foreground">
          {learned.length} / {items.length} 項目（出題済 / 全体）
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>復習スコア順</CardTitle>
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
                <th className="py-1">due_score</th>
              </tr>
            </thead>
            <tbody>
              {items.map((v) => (
                <tr key={v.id} className="border-t">
                  <td className="py-1">{v.type}</td>
                  <td className="py-1 font-medium">{v.term}</td>
                  <td className="py-1">{v.meaning}</td>
                  <td className="py-1">{v.mastery_level}</td>
                  <td className="py-1">{v.total_appearances}</td>
                  <td className="py-1">
                    {v.due_score >= 1e8 ? '新規' : v.due_score.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
