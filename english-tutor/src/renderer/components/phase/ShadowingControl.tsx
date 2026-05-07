import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useSpeechSynth } from '@/hooks/useSpeechSynth';
import { call } from '@/lib/api';
import type { Material } from '@shared/types';

interface Props {
  material: Material;
  sessionId: number;
  onDone: () => void;
}

const TARGET_REPS = 4;

export function ShadowingControl({ material, sessionId, onDone }: Props) {
  const { speak, cancel, speaking } = useSpeechSynth();
  const [reps, setReps] = useState(0);
  const [stuck, setStuck] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function play(rate: number) {
    if (speaking) cancel();
    await speak(material.script, { rate });
    setReps((r) => r + 1);
  }

  async function logStuckLine(line: string) {
    setSubmitting(true);
    try {
      await call('db:question.record', {
        sessionId,
        materialId: material.id,
        vocabularyItemId: null,
        phase: 'shadowing',
        questionText: '詰まった文',
        correctAnswer: line,
        userAnswer: line,
        isCorrect: false,
        feedback: 'シャドーイング中に詰まった文として記録',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{material.title}（シャドーイング）</CardTitle>
        <CardDescription>
          スクリプトは見ずに、少し遅れて追いかけて発声してください。{TARGET_REPS} 回が目安。現在 {reps} 回。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => play(0.95)} disabled={speaking}>通常速で再生</Button>
          <Button variant="outline" onClick={() => play(0.8)} disabled={speaking}>遅め (0.8x)</Button>
          <Button variant="ghost" onClick={() => cancel()} disabled={!speaking}>停止</Button>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">詰まった文があれば記録（任意）</p>
          <Textarea
            value={stuck}
            onChange={(e) => setStuck(e.target.value)}
            placeholder="例: I have been getting the hang of it."
          />
          <Button
            variant="secondary"
            size="sm"
            disabled={submitting || !stuck.trim()}
            onClick={async () => {
              await logStuckLine(stuck.trim());
              setStuck('');
            }}
          >
            記録
          </Button>
        </div>
        <div className="pt-4">
          <Button onClick={onDone} disabled={reps === 0}>
            シャドーイング完了
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
