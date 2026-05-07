import { Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSpeechSynth } from '@/hooks/useSpeechSynth';

interface Props {
  text: string;
  rate?: number;
  label?: string;
}

export function VoicePlayer({ text, rate, label }: Props) {
  const { speak, cancel, speaking } = useSpeechSynth();
  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant={speaking ? 'destructive' : 'default'}
        onClick={() => (speaking ? cancel() : speak(text, { rate }))}
      >
        {speaking ? <Square className="mr-1 h-4 w-4" /> : <Play className="mr-1 h-4 w-4" />}
        {speaking ? '停止' : label ?? '再生'}
      </Button>
    </div>
  );
}
