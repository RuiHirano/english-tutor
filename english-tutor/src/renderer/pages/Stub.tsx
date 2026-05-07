interface StubProps {
  title: string;
}

export function Stub({ title }: StubProps) {
  return (
    <div className="space-y-2">
      <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
      <p className="text-muted-foreground">Phase B 以降で実装します。</p>
    </div>
  );
}
