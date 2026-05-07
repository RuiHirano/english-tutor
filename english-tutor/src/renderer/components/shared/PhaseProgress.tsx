import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PHASE_LABELS_JA } from '@shared/phases';
import type { PhaseName, SessionRecord } from '@shared/types';

const FLOW: PhaseName[] = [
  'vocab',
  'listening',
  'dictation',
  'shadowing',
  'speaking',
  'retention',
];

interface Props {
  sessions: SessionRecord[];
}

export function PhaseProgress({ sessions }: Props) {
  const completed = new Set(
    sessions.filter((s) => s.ended_at !== null).map((s) => s.phase as PhaseName),
  );

  const currentIdx = FLOW.findIndex((p) => !completed.has(p));

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-3">
      {FLOW.map((phase, i) => {
        const isDone = completed.has(phase);
        const isCurrent = i === currentIdx;
        return (
          <div key={phase} className="flex items-center gap-2">
            <div
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full border text-xs font-medium',
                isDone
                  ? 'border-green-600 bg-green-600 text-white'
                  : isCurrent
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-muted-foreground/30 text-muted-foreground',
              )}
            >
              {isDone ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span
              className={cn(
                'text-sm',
                isDone
                  ? 'text-foreground'
                  : isCurrent
                    ? 'font-medium text-foreground'
                    : 'text-muted-foreground',
              )}
            >
              {PHASE_LABELS_JA[phase]}
            </span>
            {i < FLOW.length - 1 && (
              <div
                className={cn(
                  'h-px w-6',
                  isDone ? 'bg-green-600' : 'bg-muted-foreground/30',
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
