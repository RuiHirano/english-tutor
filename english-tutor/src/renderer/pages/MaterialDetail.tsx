import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PhaseProgress } from '@/components/shared/PhaseProgress';
import { VoicePlayer } from '@/components/shared/VoicePlayer';
import { call } from '@/lib/api';
import type { MaterialWithVocab } from '@shared/ipc';

export function MaterialDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{material.title}</h2>
          <p className="text-muted-foreground">
            習熟度 {material.mastery_level} / 学習回数 {material.total_appearances}
          </p>
        </div>
        <Button onClick={() => navigate(`/study?materialId=${material.id}`)}>
          <GraduationCap className="mr-1 h-4 w-4" />
          この教材で学習
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>学習フローの進捗</CardTitle>
        </CardHeader>
        <CardContent>
          <PhaseProgress sessions={material.sessions} materialId={material.id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>スクリプト</CardTitle>
            <VoicePlayer text={material.script} label="再生" />
          </div>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap text-sm leading-relaxed">{material.script}</pre>
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

      <Card>
        <CardHeader>
          <CardTitle>セッション履歴 ({material.sessions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="py-1">phase</th>
                <th className="py-1">開始</th>
                <th className="py-1">終了</th>
              </tr>
            </thead>
            <tbody>
              {material.sessions.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="py-1">{s.phase}</td>
                  <td className="py-1">{s.started_at}</td>
                  <td className="py-1">{s.ended_at ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
