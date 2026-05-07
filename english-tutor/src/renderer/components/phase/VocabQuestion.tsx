import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { AnswerRecord, PhaseQuestion } from '@/store/sessionStore';

interface Props {
  question: PhaseQuestion;
  index: number;
  total: number;
  onAnswer: (userAnswer: string) => Promise<AnswerRecord>;
}

export function VocabQuestion({ question, index, total, onAnswer }: Props) {
  const [value, setValue] = useState('');
  const [last, setLast] = useState<AnswerRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(answer: string) {
    if (!answer.trim() || submitting) return;
    setSubmitting(true);
    try {
      const r = await onAnswer(answer);
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
          <CardDescription>問題 {index + 1} / {total} — 結果</CardDescription>
          <CardTitle className={last.isCorrect ? 'text-green-600' : 'text-destructive'}>
            {last.isCorrect ? '正解' : '不正解'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">あなたの回答: <span className="font-medium">{last.userAnswer}</span></p>
          <p className="text-sm">正解: <span className="font-medium">{last.question.correct}</span></p>
          {last.modelAnswer && last.modelAnswer !== last.question.correct && (
            <p className="text-sm">参考: {last.modelAnswer}</p>
          )}
          {last.feedback && (
            <p className="text-sm text-muted-foreground">{last.feedback}</p>
          )}
          <Button
            onClick={() => {
              setLast(null);
            }}
          >
            次へ
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardDescription>問題 {index + 1} / {total}</CardDescription>
        <CardTitle className="text-xl">{question.prompt}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {question.kind === 'vocab.mc' && question.options && (
          <div className="grid grid-cols-1 gap-2">
            {question.options.map((opt) => (
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
        )}
        {(question.kind === 'vocab.fill' || question.kind === 'vocab.jp2en') && (
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              submit(value);
            }}
          >
            <Input
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={question.kind === 'vocab.fill' ? '英単語' : 'English translation'}
              disabled={submitting}
            />
            <Button type="submit" disabled={submitting || !value.trim()}>
              回答
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
