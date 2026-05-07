import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { call } from '@/lib/api';
import type { Material } from '@shared/types';

export function MaterialList() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genStatus, setGenStatus] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    call('db:material.list', { activeOnly: false })
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">教材</h2>
          <p className="text-muted-foreground">これまでに生成・学習した教材</p>
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
