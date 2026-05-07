import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { call } from '@/lib/api';
import type { DailyActivity, MasteryDistribution, OverallStats } from '@shared/types';

interface Stats {
  overall: OverallStats;
  daily: DailyActivity[];
  vocabDist: MasteryDistribution[];
  materialDist: MasteryDistribution[];
}

export function Home() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genStatus, setGenStatus] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  async function generate() {
    setGenerating(true);
    setGenStatus('Claude に教材生成を依頼中…');
    try {
      const profile = await call('db:profile.get', undefined);
      if (!profile) {
        setGenStatus('プロフィール未設定。先にプロフィールを保存してください。');
        return;
      }
      const mistakes = await call('db:vocab.mistakes', { limit: 10 });
      const draft = await call('claude:generateMaterial', { profile, mistakes });
      const created = await call('db:material.create', {
        title: draft.title,
        script: draft.script,
        items: draft.items,
      });
      setGenStatus(
        `生成完了: 「${draft.title}」 (#${created.materialId}) — vocab ${created.vocabularyItemIds.length} 件`,
      );
      setReloadKey((k) => k + 1);
    } catch (e) {
      setGenStatus(`失敗: ${(e as Error).message}`);
    } finally {
      setGenerating(false);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const [overall, daily, vocabDist, materialDist] = await Promise.all([
          call('db:stats.overall', undefined),
          call('db:stats.daily', { days: 14 }),
          call('db:stats.masteryDistribution', { scope: 'vocabulary_items' }),
          call('db:stats.masteryDistribution', { scope: 'materials' }),
        ]);
        setStats({ overall, daily, vocabDist, materialDist });
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, [reloadKey]);

  if (error) {
    return (
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">ホーム</h2>
        <p className="text-destructive">エラー: {error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">ホーム</h2>
        <p className="text-muted-foreground">読み込み中…</p>
      </div>
    );
  }

  const { overall, daily, vocabDist, materialDist } = stats;
  const accuracy = (overall.accuracy * 100).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">ホーム</h2>
          <p className="text-muted-foreground">学習状況のサマリ</p>
        </div>
        <Button onClick={generate} disabled={generating}>
          <Sparkles className="mr-1 h-4 w-4" />
          {generating ? '生成中…' : '新しい教材を生成'}
        </Button>
      </div>

      {genStatus && (
        <Card>
          <CardContent className="py-3 text-sm text-muted-foreground">{genStatus}</CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="教材数" value={overall.total_materials} />
        <StatCard label="語彙項目" value={overall.total_vocabulary_items} />
        <StatCard label="セッション" value={overall.total_sessions} />
        <StatCard label="正答率" value={`${accuracy}%`} sub={`${overall.correct_questions} / ${overall.total_questions}`} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>直近 14 日のセッション数</CardTitle>
            <CardDescription>1 日あたりの学習回数</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="sessions" stroke="#0f172a" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>習熟度分布（語彙）</CardTitle>
            <CardDescription>0=未学習 / 1=認識 / 2=使用 / 3=自動化</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={vocabDist}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mastery_level" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="n" fill="#0f172a" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>習熟度分布（教材）</CardTitle>
            <CardDescription>教材ごとの完了状況</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={materialDist}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mastery_level" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="n" fill="#475569" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
      {sub && (
        <CardContent>
          <p className="text-xs text-muted-foreground">{sub}</p>
        </CardContent>
      )}
    </Card>
  );
}
