import { useMemo, useState } from 'react';
import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { BANDS, LEVEL_WORDS, estimateLevel, type CefrBand } from './words';

const BAND_COLOR: Record<CefrBand, string> = {
  A1: 'bg-rose-100 text-rose-700 border-rose-200',
  A2: 'bg-orange-100 text-orange-700 border-orange-200',
  B1: 'bg-amber-100 text-amber-700 border-amber-200',
  B2: 'bg-sky-100 text-sky-700 border-sky-200',
  C1: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  C2: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

export function LevelTest() {
  const queue = useMemo(() => LEVEL_WORDS, []);
  const [cursor, setCursor] = useState(0);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [done, setDone] = useState(false);

  function record(known: boolean) {
    const w = queue[cursor];
    setAnswers((a) => ({ ...a, [w.term]: known }));
    if (cursor + 1 >= queue.length) {
      setDone(true);
    } else {
      setCursor(cursor + 1);
    }
  }

  function reset() {
    setCursor(0);
    setAnswers({});
    setDone(false);
  }

  if (done) {
    const result = estimateLevel(answers);
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">レベル測定 結果</h2>
          <p className="text-muted-foreground">
            知っていると答えた語の割合からレベルを推定しました（70% 以上を「クリア」と判定）。
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardDescription>推定レベル</CardDescription>
            <CardTitle className="text-5xl">
              {typeof result.level === 'string' && result.level !== 'A1未満' ? (
                <span
                  className={cn(
                    'inline-block rounded-md border px-4 py-2',
                    BAND_COLOR[result.level],
                  )}
                >
                  {result.level}
                </span>
              ) : (
                <span className="text-muted-foreground">{result.level}</span>
              )}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">バンド別の正答率</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="py-1 pr-2">CEFR</th>
                  <th className="py-1 pr-2">知っている</th>
                  <th className="py-1 pr-2">割合</th>
                  <th className="py-1 pr-2">クリア</th>
                </tr>
              </thead>
              <tbody>
                {result.perBand.map((b) => (
                  <tr key={b.band} className="border-t">
                    <td className="py-1 pr-2">
                      <span
                        className={cn(
                          'inline-block rounded-md border px-2 py-0.5 text-xs font-medium',
                          BAND_COLOR[b.band],
                        )}
                      >
                        {b.band}
                      </span>
                    </td>
                    <td className="py-1 pr-2 tabular-nums">
                      {b.known} / {b.total}
                    </td>
                    <td className="py-1 pr-2 tabular-nums">
                      {(b.ratio * 100).toFixed(0)}%
                    </td>
                    <td className="py-1 pr-2">
                      {b.ratio >= 0.7 ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">「知らない」と答えた語</CardTitle>
            <CardDescription>意味を確認しましょう</CardDescription>
          </CardHeader>
          <CardContent>
            {LEVEL_WORDS.filter((w) => answers[w.term] === false).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                すべて知っていると答えました。お見事。
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr>
                    <th className="py-1 pr-2">CEFR</th>
                    <th className="py-1 pr-2">term</th>
                    <th className="py-1 pr-2">意味</th>
                  </tr>
                </thead>
                <tbody>
                  {LEVEL_WORDS.filter((w) => answers[w.term] === false).map((w) => (
                    <tr key={w.term} className="border-t">
                      <td className="py-1 pr-2">
                        <span
                          className={cn(
                            'inline-block rounded-md border px-2 py-0.5 text-xs',
                            BAND_COLOR[w.band],
                          )}
                        >
                          {w.band}
                        </span>
                      </td>
                      <td className="py-1 pr-2 font-medium">{w.term}</td>
                      <td className="py-1 pr-2 text-muted-foreground">{w.meaning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Button variant="outline" onClick={reset}>
          <RotateCcw className="mr-1 h-4 w-4" />
          もう一度
        </Button>
      </div>
    );
  }

  const current = queue[cursor];
  const counts: Record<CefrBand, number> = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 };
  for (const w of queue.slice(0, cursor)) counts[w.band]++;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">レベル測定</h2>
        <p className="text-muted-foreground">
          各単語・表現の意味を「知っている」「知らない」で答えてください（{queue.length} 問）。
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>進捗: {cursor + 1} / {queue.length}</span>
        <div className="flex gap-1">
          {BANDS.map((b) => (
            <span
              key={b}
              className={cn(
                'rounded-md border px-1.5 py-0.5 text-[10px] font-medium',
                BAND_COLOR[b],
                counts[b] === 0 && 'opacity-40',
              )}
            >
              {b}: {counts[b]}
            </span>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardDescription>
            問題 {cursor + 1} / {queue.length} ・
            <span
              className={cn(
                'ml-2 inline-block rounded-md border px-2 py-0.5 text-xs',
                BAND_COLOR[current.band],
              )}
            >
              {current.band}
            </span>
          </CardDescription>
          <CardTitle className="text-4xl">{current.term}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={() => record(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <CheckCircle2 className="mr-1 h-4 w-4" />
            知っている
          </Button>
          <Button variant="outline" onClick={() => record(false)}>
            <XCircle className="mr-1 h-4 w-4" />
            知らない
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
