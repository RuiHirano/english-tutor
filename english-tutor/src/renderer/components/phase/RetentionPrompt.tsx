import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import type { AnswerRecord, PhaseQuestion } from '@/store/sessionStore';

interface Props {
  question: PhaseQuestion;
  index: number;
  total: number;
  onAnswer: (userAnswer: string) => Promise<AnswerRecord>;
}

export function RetentionPrompt({ question, index, total, onAnswer }: Props) {
  const [value, setValue] = useState('');
  const [last, setLast] = useState<AnswerRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const meta = (question.meta ?? {}) as { requiredExpressions?: string[] };

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
            {last.isCorrect ? '回収成功' : '再挑戦推奨'}
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
        <CardDescription>問題 {index + 1} / {total} — リテンションテスト</CardDescription>
        <CardTitle className="text-xl whitespace-pre-wrap">{question.prompt}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {meta.requiredExpressions && meta.requiredExpressions.length > 0 && (
          <div className="rounded-md border bg-muted/40 p-3">
            <p className="text-xs font-medium text-muted-foreground">必須表現</p>
            <ul className="mt-1 text-sm">
              {meta.requiredExpressions.map((t) => (
                <li key={t}>• {t}</li>
              ))}
            </ul>
          </div>
        )}
        <Textarea
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="自由に英語で話す（書き起こしを入力）"
          disabled={submitting}
          rows={6}
        />
        <Button onClick={submit} disabled={submitting || !value.trim()}>
          回答
        </Button>
      </CardContent>
    </Card>
  );
}
