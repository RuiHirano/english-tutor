import { useNavigate } from 'react-router-dom';
import { Check, Play } from 'lucide-react';
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
  /** When set, completed and current steps become clickable. */
  materialId?: number;
}

export function PhaseProgress({ sessions, materialId }: Props) {
  const navigate = useNavigate();
  const completed = new Set(
    sessions.filter((s) => s.ended_at !== null).map((s) => s.phase as PhaseName),
  );
  const currentIdx = FLOW.findIndex((p) => !completed.has(p));

  function go(phase: PhaseName) {
    if (!materialId) return;
    navigate(`/study?materialId=${materialId}&phase=${phase}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-3">
      {FLOW.map((phase, i) => {
        const isDone = completed.has(phase);
        const isCurrent = i === currentIdx;
        const isClickable = (isDone || isCurrent) && materialId !== undefined;
        const Container = isClickable ? 'button' : 'div';
        return (
          <div key={phase} className="flex items-center gap-2">
            <Container
              type={isClickable ? 'button' : undefined}
              onClick={isClickable ? () => go(phase) : undefined}
              disabled={Container === 'button' ? !isClickable : undefined}
              title={
                isClickable
                  ? `${PHASE_LABELS_JA[phase]} を開始`
                  : '前のフェーズを完了すると有効になります'
              }
              className={cn(
                'group flex items-center gap-2 rounded-full text-left transition-colors',
                isClickable
                  ? 'cursor-pointer px-1 py-0.5 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                  : 'cursor-not-allowed opacity-70',
              )}
            >
              <div
                className={cn(
                  'relative flex h-7 w-7 items-center justify-center rounded-full border text-xs font-medium transition',
                  isDone
                    ? 'border-green-600 bg-green-600 text-white'
                    : isCurrent
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-muted-foreground/30 text-muted-foreground',
                  isClickable && 'group-hover:scale-110 group-hover:shadow',
                )}
              >
                <span
                  className={cn(
                    'flex items-center justify-center',
                    isClickable && 'group-hover:hidden',
                  )}
                >
                  {isDone ? <Check className="h-4 w-4" /> : i + 1}
                </span>
                {isClickable && (
                  <Play className="hidden h-4 w-4 fill-current group-hover:block" />
                )}
              </div>
              <span
                className={cn(
                  'text-sm',
                  isDone
                    ? 'text-foreground'
                    : isCurrent
                      ? 'font-medium text-foreground'
                      : 'text-muted-foreground',
                  isClickable && 'group-hover:underline',
                )}
              >
                {PHASE_LABELS_JA[phase]}
              </span>
            </Container>
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
