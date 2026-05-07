import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { VoicePlayer } from '@/components/shared/VoicePlayer';
import type { AnswerRecord, PhaseQuestion } from '@/store/sessionStore';

interface Props {
  question: PhaseQuestion;
  index: number;
  total: number;
  onAnswer: (userAnswer: string) => Promise<AnswerRecord>;
}

export function ListeningQuestion({ question, index, total, onAnswer }: Props) {
  const [last, setLast] = useState<AnswerRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(answer: string) {
    if (submitting) return;
    setSubmitting(true);
    try {
      const r = await onAnswer(answer);
      setLast(r);
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

  const meta = (question.meta ?? {}) as { audio?: string };
  const options = question.options ?? ['True', 'False'];

  return (
    <Card>
      <CardHeader>
        <CardDescription>
          問題 {index + 1} / {total}
        </CardDescription>
        <CardTitle className="text-xl">{question.prompt}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {meta.audio && <VoicePlayer text={meta.audio} label="再生（教材）" />}
        <div className="grid grid-cols-1 gap-2">
          {options.map((opt) => (
            <Button
              key={opt}
              variant="outline"
              className="justify-start"
              disabled={submitting}
              onClick={() => submit(opt)}
            >
              {opt}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
