import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { VoicePlayer } from '@/components/shared/VoicePlayer';
import type { AnswerRecord, PhaseQuestion } from '@/store/sessionStore';

interface Props {
  question: PhaseQuestion;
  index: number;
  total: number;
  onAnswer: (userAnswer: string) => Promise<AnswerRecord>;
}

export function SpeakingPrompt({ question, index, total, onAnswer }: Props) {
  const [value, setValue] = useState('');
  const [last, setLast] = useState<AnswerRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const meta = (question.meta ?? {}) as { audio?: string; targetTerms?: string[]; subKind?: 'jp2en' | 'read' };

  async function submit() {
    if (!value.trim() || submitting) return;
    setSubmitting(true);
    try {
      const r = await onAnswer(value);
      setLast(r);
      setValue('');
    } finally {
      setSubmitting(false);
    }
  }

  if (last) {
    return (
      <Card>
        <CardHeader>
          <CardDescription>問題 {index + 1} / {total} — フィードバック</CardDescription>
          <CardTitle className={last.isCorrect ? 'text-green-600' : 'text-destructive'}>
            {last.isCorrect ? 'OK' : '要練習'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">あなたの回答: {last.userAnswer}</p>
          {last.modelAnswer && <p className="text-sm">模範: {last.modelAnswer}</p>}
          {last.feedback && <p className="text-sm text-muted-foreground">{last.feedback}</p>}
          <Button onClick={() => setLast(null)}>次へ</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardDescription>
          問題 {index + 1} / {total} — {meta.subKind === 'read' ? '音読＋暗唱' : '日→英 即答'}
        </CardDescription>
        <CardTitle className="text-xl whitespace-pre-wrap">{question.prompt}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {meta.audio && <VoicePlayer text={meta.audio} label="音声で確認" />}
        <p className="text-xs text-muted-foreground">
          ヒント: macOS の Dictation（fn fn）で発話を入力できます。
        </p>
        <Textarea
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="話した英語をここに入力 / 書き起こし"
          disabled={submitting}
        />
        <Button onClick={submit} disabled={submitting || !value.trim()}>
          回答
        </Button>
      </CardContent>
    </Card>
  );
}
