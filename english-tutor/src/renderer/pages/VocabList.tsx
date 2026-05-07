import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { call } from '@/lib/api';
import type { MasteryLevel, VocabDue } from '@shared/types';

interface LevelMeta {
  label: string;
  description: string;
  badge: string; // bg + text classes for the badge
  card: string; // border + accent classes for the card
}

const LEVELS: Array<{ level: MasteryLevel } & LevelMeta> = [
  {
    level: 0,
    label: '未学習',
    description: 'まだ問題を出していない / 答えていない',
    badge: 'bg-rose-100 text-rose-700 border-rose-200',
    card: 'border-rose-200',
  },
  {
    level: 1,
    label: '認識',
    description: '意味は分かるが使えない',
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    card: 'border-amber-200',
  },
  {
    level: 2,
    label: '使用',
    description: '文脈の中で使える',
    badge: 'bg-sky-100 text-sky-700 border-sky-200',
    card: 'border-sky-200',
  },
  {
    level: 3,
    label: '自動化',
    description: '無意識に使える',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    card: 'border-emerald-200',
  },
];

const TYPE_LABELS: Record<string, string> = {
  vocab: '語彙',
  expression: '表現',
  grammar: '文法',
};

export function VocabList() {
  const [items, setItems] = useState<VocabDue[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    call('db:vocab.due', { limit: 500 })
      .then(setItems)
      .catch((e) => setError((e as Error).message));
  }, []);

  const groups = useMemo(() => {
    const byLevel: Record<MasteryLevel, VocabDue[]> = { 0: [], 1: [], 2: [], 3: [] };
    for (const it of items) {
      byLevel[it.mastery_level].push(it);
    }
    for (const level of [0, 1, 2, 3] as MasteryLevel[]) {
      byLevel[level].sort((a, b) => b.due_score - a.due_score);
    }
    return byLevel;
  }, [items]);

  const learnedCount = items.filter((i) => (i.total_appearances ?? 0) > 0).length;

  if (error) return <p className="text-destructive">{error}</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">学んだ単語</h2>
        <p className="text-muted-foreground">
          {learnedCount} / {items.length} 項目（出題済 / 全体）。習熟度別に表示。
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {LEVELS.map(({ level, label, badge }) => (
          <div
            key={level}
            className={cn(
              'rounded-lg border px-4 py-3',
              LEVELS.find((l) => l.level === level)?.card,
            )}
          >
            <div className="flex items-center gap-2">
              <span className={cn('rounded-full border px-2 py-0.5 text-xs font-medium', badge)}>
                Lv {level}
              </span>
              <span className="text-sm font-medium">{label}</span>
            </div>
            <p className="mt-1 text-2xl font-semibold">{groups[level].length}</p>
          </div>
        ))}
      </div>

      {LEVELS.map(({ level, label, description, card, badge }) => (
        <Card key={level} className={cn('border-l-4', card)}>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className={cn('rounded-full border px-2 py-0.5 text-xs font-medium', badge)}>
                  Lv {level}
                </span>
                <CardTitle className="text-lg">{label}</CardTitle>
                <span className="text-xs text-muted-foreground">— {description}</span>
              </div>
              <span className="text-sm text-muted-foreground">{groups[level].length} 件</span>
            </div>
          </CardHeader>
          <CardContent>
            {groups[level].length === 0 ? (
              <p className="text-sm text-muted-foreground">該当なし</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr>
                    <th className="py-1 pr-2">type</th>
                    <th className="py-1 pr-2">term</th>
                    <th className="py-1 pr-2">meaning</th>
                    <th className="py-1 pr-2">出現回数</th>
                    <th className="py-1 pr-2">due</th>
                  </tr>
                </thead>
                <tbody>
                  {groups[level].map((v) => (
                    <tr key={v.id} className="border-t">
                      <td className="py-1 pr-2">
                        <span className="text-xs text-muted-foreground">
                          {v.type ? (TYPE_LABELS[v.type] ?? v.type) : '—'}
                        </span>
                      </td>
                      <td className="py-1 pr-2 font-medium">{v.term}</td>
                      <td className="py-1 pr-2 text-muted-foreground">{v.meaning}</td>
                      <td className="py-1 pr-2 tabular-nums">{v.total_appearances}</td>
                      <td className="py-1 pr-2 tabular-nums text-xs text-muted-foreground">
                        {v.due_score >= 1e8 ? '新規' : v.due_score.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
