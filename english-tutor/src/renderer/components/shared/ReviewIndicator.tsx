import { cn } from '@/lib/utils';

interface Props {
  score: number;
  className?: string;
}

interface Bucket {
  label: string;
  dot: string;
  text: string;
}

function bucketFor(score: number): Bucket {
  if (score >= 1e8) {
    return { label: '新規', dot: 'bg-blue-500', text: 'text-blue-700' };
  }
  if (score > 0) {
    return { label: '要復習', dot: 'bg-rose-500', text: 'text-rose-700' };
  }
  if (score > -1) {
    return { label: 'もうすぐ', dot: 'bg-amber-500', text: 'text-amber-700' };
  }
  return { label: '定着中', dot: 'bg-emerald-500', text: 'text-emerald-700' };
}

export function ReviewIndicator({ score, className }: Props) {
  const b = bucketFor(score);
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs', b.text, className)}>
      <span className={cn('h-2.5 w-2.5 rounded-full', b.dot)} aria-hidden />
      {b.label}
    </span>
  );
}
