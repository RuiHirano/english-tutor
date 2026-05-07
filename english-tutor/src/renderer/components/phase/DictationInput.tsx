import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { VoicePlayer } from '@/components/shared/VoicePlayer';
import type { AnswerRecord, PhaseQuestion } from '@/store/sessionStore';

interface Props {
  question: PhaseQuestion;
  index: number;
  total: number;
  onAnswer: (userAnswer: string) => Promise<AnswerRecord>;
}

export function DictationInput({ question, index, total, onAnswer }: Props) {
  const [value, setValue] = useState('');
  const [last, setLast] = useState<AnswerRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const meta = (question.meta ?? {}) as { audio?: string };
  const isFull = question.kind === 'dictation.full';

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
          <CardDescription>
            問題 {index + 1} / {total} — 結果
          </CardDescription>
          <CardTitle className={last.isCorrect ? 'text-green-600' : 'text-destructive'}>
            {last.isCorrect ? '正解' : '不正解'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">あなたの回答: {last.userAnswer}</p>
          <p className="text-sm">正解: {last.question.correct}</p>
          <Button onClick={() => setLast(null)}>次へ</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardDescription>
          問題 {index + 1} / {total} —{' '}
          {question.kind === 'dictation.partial'
            ? '部分ディクテーション'
            : question.kind === 'dictation.functional'
              ? '機能語ディクテーション'
              : '全文ディクテーション'}
        </CardDescription>
        {!isFull && <CardTitle className="text-xl whitespace-pre-wrap">{question.prompt}</CardTitle>}
        {isFull && <CardTitle className="text-xl">音声を聞いて全文を書き取ってください</CardTitle>}
      </CardHeader>
      <CardContent className="space-y-4">
        {meta.audio && <VoicePlayer text={meta.audio} rate={0.9} label="音声を再生" />}
        {isFull ? (
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="聞き取った文を入力"
            disabled={submitting}
          />
        ) : (
          <Input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="ブランクを埋める単語"
            disabled={submitting}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
        )}
        <Button onClick={submit} disabled={submitting || !value.trim()}>
          回答
        </Button>
      </CardContent>
    </Card>
  );
}
