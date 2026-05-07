import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { call } from '@/lib/api';
import type { Material } from '@shared/types';

interface Props {
  materialId: number;
  /** Hide the script reveal button (e.g. shadowing where script must stay hidden). */
  hideScript?: boolean;
}

export function MaterialHeader({ materialId, hideScript = false }: Props) {
  const [material, setMaterial] = useState<Material | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    call('db:material.get', { id: materialId }).then((m) => setMaterial(m));
  }, [materialId]);

  if (!material) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-lg">{material.title}</CardTitle>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>習熟度 {material.mastery_level}</span>
            <span>学習 {material.total_appearances} 回</span>
            {!hideScript && (
              <Button size="sm" variant="ghost" onClick={() => setOpen((o) => !o)}>
                {open ? <ChevronDown className="mr-1 h-3 w-3" /> : <ChevronRight className="mr-1 h-3 w-3" />}
                スクリプト
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      {open && !hideScript && (
        <CardContent>
          <pre className="whitespace-pre-wrap text-sm leading-relaxed">{material.script}</pre>
        </CardContent>
      )}
    </Card>
  );
}
