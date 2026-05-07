export function relativeJa(iso: string | null | undefined): string {
  if (!iso) return '未学習';
  const t = Date.parse(iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z');
  if (Number.isNaN(t)) return iso;
  const now = Date.now();
  const diffSec = Math.floor((now - t) / 1000);
  if (diffSec < 60) return 'たった今';
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min} 分前`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour} 時間前`;
  const day = Math.floor(hour / 24);
  if (day === 1) return '昨日';
  if (day < 14) return `${day} 日前`;
  if (day < 60) return `${Math.floor(day / 7)} 週間前`;
  return new Date(t).toISOString().slice(0, 10);
}
