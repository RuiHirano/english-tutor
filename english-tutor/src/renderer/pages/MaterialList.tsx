import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { call } from '@/lib/api';
import { cn } from '@/lib/utils';
import { relativeJa } from '@/lib/time';
import type { MaterialWithProgress } from '@shared/ipc';
import type { MasteryLevel, PhaseName } from '@shared/types';

const FLOW: PhaseName[] = [
  'vocab',
  'listening',
  'dictation',
  'shadowing',
  'speaking',
  'retention',
];

const MASTERY_META: Record<
  MasteryLevel,
  { label: string; badge: string; bar: string }
> = {
  0: {
    label: '未学習',
    badge: 'bg-rose-100 text-rose-700 border-rose-200',
    bar: 'bg-rose-400',
  },
  1: {
    label: '認識',
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    bar: 'bg-amber-400',
  },
  2: {
    label: '使用',
    badge: 'bg-sky-100 text-sky-700 border-sky-200',
    bar: 'bg-sky-400',
  },
  3: {
    label: '完了',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    bar: 'bg-emerald-400',
  },
};

interface Group {
  key: 'in_progress' | 'untouched' | 'done';
  title: string;
  description: string;
  materials: MaterialWithProgress[];
}

function classify(m: MaterialWithProgress): Group['key'] {
  if (m.mastery_level >= 3) return 'done';
  if (m.completed_phases.length === 0 && m.total_appearances === 0) return 'untouched';
  return 'in_progress';
}

export function MaterialList() {
  const [materials, setMaterials] = useState<MaterialWithProgress[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genStatus, setGenStatus] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    call('db:material.listWithProgress', {})
      .then(setMaterials)
      .catch((e) => setError((e as Error).message));
  }, [reloadKey]);

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
        script_ja: draft.script_ja,
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

  const groups = useMemo<Group[]>(() => {
    const buckets: Record<Group['key'], MaterialWithProgress[]> = {
      in_progress: [],
      untouched: [],
      done: [],
    };
    for (const m of materials) buckets[classify(m)].push(m);
    return [
      {
        key: 'in_progress',
        title: '学習中',
        description: '途中まで進んでいる教材',
        materials: buckets.in_progress,
      },
      {
        key: 'untouched',
        title: '未着手',
        description: 'まだ学習を始めていない教材',
        materials: buckets.untouched,
      },
      {
        key: 'done',
        title: '完了',
        description: '習熟度 3（自動化）に到達した教材',
        materials: buckets.done,
      },
    ];
  }, [materials]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">教材</h2>
          <p className="text-muted-foreground">{materials.length} 件</p>
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

      {error && <p className="text-destructive">{error}</p>}

      {materials.length === 0 && !error && (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            まだ教材がありません。右上の「新しい教材を生成」から始めましょう。
          </CardContent>
        </Card>
      )}

      {groups.map(
        (g) =>
          g.materials.length > 0 && (
            <section key={g.key} className="space-y-2">
              <div className="flex items-baseline gap-2">
                <h3 className="text-lg font-semibold">{g.title}</h3>
                <span className="text-xs text-muted-foreground">{g.description}</span>
                <span className="ml-auto text-xs text-muted-foreground">{g.materials.length} 件</span>
              </div>
              <div className="space-y-2">
                {g.materials.map((m) => (
                  <MaterialRow key={m.id} material={m} />
                ))}
              </div>
            </section>
          ),
      )}
    </div>
  );
}

function MaterialRow({ material }: { material: MaterialWithProgress }) {
  const meta = MASTERY_META[material.mastery_level];
  const completed = new Set(material.completed_phases);
  const completedCount = FLOW.filter((p) => completed.has(p)).length;
  const progressPct = (completedCount / FLOW.length) * 100;

  return (
    <Link to={`/materials/${material.id}`}>
      <Card className="group transition-all hover:border-primary hover:shadow-sm">
        <CardContent className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    'rounded-md border px-2 py-0.5 text-[10px] font-medium',
                    meta.badge,
                  )}
                >
                  Lv {material.mastery_level} {meta.label}
                </span>
                <h4 className="truncate text-base font-semibold">{material.title}</h4>
              </div>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>{relativeJa(material.last_appeared_at)}</span>
                <span>語彙 {material.vocab_count}</span>
                <span>学習 {material.total_appearances} 回</span>
              </div>
            </div>
            <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>フェーズ進捗</span>
              <span>
                {completedCount} / {FLOW.length}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {FLOW.map((phase) => {
                const done = completed.has(phase);
                return (
                  <span
                    key={phase}
                    title={phase}
                    className={cn(
                      'h-2 flex-1 rounded-full',
                      done ? meta.bar : 'bg-muted',
                    )}
                  />
                );
              })}
            </div>
            <div
              className="hidden"
              aria-hidden
              data-progress-pct={progressPct.toFixed(1)}
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
