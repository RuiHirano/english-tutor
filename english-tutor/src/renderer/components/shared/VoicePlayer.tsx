import { Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSpeechSynth } from '@/hooks/useSpeechSynth';

interface Props {
  text: string;
  rate?: number;
  label?: string;
  /** 複数の再生速度を選べるようにする。指定するとボタンが速度数だけ並ぶ。 */
  rates?: number[];
}

export function VoicePlayer({ text, rate, label, rates }: Props) {
  const { speak, cancel, speaking } = useSpeechSynth();

  if (rates && rates.length > 0) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {rates.map((r) => (
          <Button
            key={r}
            size="sm"
            variant="outline"
            disabled={speaking}
            onClick={() => speak(text, { rate: r })}
          >
            <Play className="mr-1 h-4 w-4" />
            {r === 1 ? '通常速' : `${r}x`}
          </Button>
        ))}
        <Button
          size="sm"
          variant={speaking ? 'destructive' : 'ghost'}
          disabled={!speaking}
          onClick={() => cancel()}
        >
          <Square className="mr-1 h-4 w-4" />
          停止
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant={speaking ? 'destructive' : 'default'}
        onClick={() => (speaking ? cancel() : speak(text, { rate }))}
      >
        {speaking ? <Square className="mr-1 h-4 w-4" /> : <Play className="mr-1 h-4 w-4" />}
        {speaking ? '停止' : (label ?? '再生')}
      </Button>
    </div>
  );
}
