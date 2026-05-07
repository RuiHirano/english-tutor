import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useProfileStore } from '@/store/profileStore';
import type { CefrLevel } from '@shared/types';

const LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export function ProfileSetup() {
  const { profile, load, save, loading } = useProfileStore();
  const navigate = useNavigate();
  const [goal, setGoal] = useState('');
  const [level, setLevel] = useState<CefrLevel>('B1');
  const [interests, setInterests] = useState('');

  useEffect(() => {
    if (!profile) load();
  }, [profile, load]);

  useEffect(() => {
    if (profile) {
      setGoal(profile.goal);
      setLevel(profile.level);
      setInterests(profile.interests);
    }
  }, [profile]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await save({ goal, level, interests });
    navigate('/');
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">プロフィール</h2>
        <p className="text-muted-foreground">学習目的・レベル・関心領域を設定</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{profile ? '更新' : '初期設定'}</CardTitle>
          <CardDescription>教材生成に反映されます</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="goal">目的 (goal)</Label>
              <Input
                id="goal"
                placeholder="例: ビジネス英会話で議事進行できるようになる"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="level">CEFR レベル</Label>
              <select
                id="level"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={level}
                onChange={(e) => setLevel(e.target.value as CefrLevel)}
              >
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="interests">関心領域</Label>
              <Textarea
                id="interests"
                placeholder="例: SaaS, テクノロジー, 旅行, 料理"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading}>
              保存
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
