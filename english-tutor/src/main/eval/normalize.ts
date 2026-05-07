export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKC')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[.,?!;:"'()]/g, '');
}
