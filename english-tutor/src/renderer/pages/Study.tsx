import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DictationInput } from '@/components/phase/DictationInput';
import { ListeningQuestion } from '@/components/phase/ListeningQuestion';
import { RetentionPrompt } from '@/components/phase/RetentionPrompt';
import { ShadowingControl } from '@/components/phase/ShadowingControl';
import { SpeakingPrompt } from '@/components/phase/SpeakingPrompt';
import { VocabQuestion } from '@/components/phase/VocabQuestion';
import { VoicePlayer } from '@/components/shared/VoicePlayer';
import { call } from '@/lib/api';
import {
  buildDictationPhaseQueue,
  buildListeningPhaseQueue,
  buildRetentionPhaseQueue,
  buildReviewPhaseQueue,
  buildSpeakingPhaseQueue,
  buildVocabPhaseQueue,
} from '@/lib/phaseQueues';
import { PHASE_LABELS_JA } from '@shared/phases';
import type { CefrLevel, Material, PhaseDescriptor, PhaseName } from '@shared/types';
import { useProfileStore } from '@/store/profileStore';
import { useSessionStore, type PhaseQuestion } from '@/store/sessionStore';

type SupportedPhase =
  | 'vocab'
  | 'listening'
  | 'dictation'
  | 'shadowing'
  | 'speaking'
  | 'retention'
  | 'review';

export function Study() {
  const navigate = useNavigate();
  const session = useSessionStore();
  const profileStore = useProfileStore();
  const [descriptor, setDescriptor] = useState<PhaseDescriptor | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [shadowMaterial, setShadowMaterial] = useState<Material | null>(null);
  const [shadowSessionId, setShadowSessionId] = useState<number | null>(null);
  const [shadowDone, setShadowDone] = useState(false);

  useEffect(() => {
    Promise.all([
      call('db:state.next', undefined),
      profileStore.profile ? Promise.resolve() : profileStore.load(),
    ])
      .then(([d]) => setDescriptor(d))
      .catch((e) => setError((e as Error).message));
    return () => {
      session.reset();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!descriptor) return;
    if (descriptor.kind === 'profile-setup') {
      navigate('/profile');
      return;
    }
    if (descriptor.kind === 'material-new') return;
    if (!isSupportedPhase(descriptor.phase)) return;

    (async () => {
      setLoadingQueue(true);
      try {
        const level: CefrLevel = profileStore.profile?.level ?? 'B1';
        if (descriptor.phase === 'shadowing') {
          const m = await call('db:material.get', { id: descriptor.materialId });
          if (!m) throw new Error('Material not found');
          const { sessionId } = await call('db:session.open', {
            materialId: descriptor.materialId,
            phase: 'shadowing',
          });
          setShadowMaterial(m);
          setShadowSessionId(sessionId);
          return;
        }
        let queue: PhaseQuestion[] = [];
        if (descriptor.phase === 'vocab') {
          queue = await buildVocabPhaseQueue(descriptor.materialId);
        } else if (descriptor.phase === 'listening') {
          queue = await buildListeningPhaseQueue(descriptor.materialId, level);
        } else if (descriptor.phase === 'dictation') {
          queue = await buildDictationPhaseQueue(descriptor.materialId, level);
        } else if (descriptor.phase === 'speaking') {
          queue = await buildSpeakingPhaseQueue(descriptor.materialId, level);
        } else if (descriptor.phase === 'retention') {
          const r = await buildRetentionPhaseQueue();
          queue = r.queue;
        } else if (descriptor.phase === 'review') {
          queue = await buildReviewPhaseQueue();
        }
        if (queue.length === 0) {
          setCompleted(true);
          return;
        }
        await session.start(descriptor.materialId, descriptor.phase, queue);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoadingQueue(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [descriptor]);

  useEffect(() => {
    if (session.queue.length > 0 && session.cursor >= session.queue.length && !completed) {
      session.finish().then(() => setCompleted(true));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.cursor, session.queue.length]);

  if (error) {
    return (
      <div>
        <h2 className="text-3xl font-bold tracking-tight">学習</h2>
        <p className="text-destructive mt-2">{error}</p>
      </div>
    );
  }

  if (!descriptor) {
    return (
      <div>
        <h2 className="text-3xl font-bold tracking-tight">学習</h2>
        <p className="text-muted-foreground mt-2">次のフェーズを判定中…</p>
      </div>
    );
  }

  if (descriptor.kind === 'profile-setup') return null;

  if (descriptor.kind === 'material-new') {
    return (
      <div className="space-y-4">
        <h2 className="text-3xl font-bold tracking-tight">学習</h2>
        <Card>
          <CardHeader>
            <CardTitle>新しい教材が必要です</CardTitle>
            <CardDescription>
              Phase F で実装される「教材生成」を待つか、手動で作成してください。
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!isSupportedPhase(descriptor.phase)) {
    return (
      <div className="space-y-4">
        <h2 className="text-3xl font-bold tracking-tight">学習</h2>
        <Card>
          <CardHeader>
            <CardTitle>{PHASE_LABELS_JA[descriptor.phase]}</CardTitle>
            <CardDescription>このフェーズは後続の Phase で実装予定です。</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (loadingQueue) {
    return (
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{PHASE_LABELS_JA[descriptor.phase]}</h2>
        <p className="text-muted-foreground mt-2">問題を準備中…</p>
      </div>
    );
  }

  // Shadowing path uses its own component (no question queue).
  if (descriptor.phase === 'shadowing') {
    if (!shadowMaterial || shadowSessionId === null) return null;
    if (shadowDone) {
      return (
        <div className="space-y-4">
          <h2 className="text-3xl font-bold tracking-tight">シャドーイング完了</h2>
          <Button onClick={() => navigate('/')}>ホームへ</Button>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <h2 className="text-3xl font-bold tracking-tight">{PHASE_LABELS_JA.shadowing}</h2>
        <ShadowingControl
          material={shadowMaterial}
          sessionId={shadowSessionId}
          onDone={async () => {
            await call('db:session.close', { sessionId: shadowSessionId });
            setShadowDone(true);
          }}
        />
      </div>
    );
  }

  if (completed) {
    const correct = session.history.filter((h) => h.isCorrect).length;
    return (
      <div className="space-y-4">
        <h2 className="text-3xl font-bold tracking-tight">セッション完了</h2>
        <Card>
          <CardHeader>
            <CardTitle>
              {correct} / {session.history.length} 正解
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')}>ホームへ</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (session.queue.length === 0) {
    return (
      <div>
        <h2 className="text-3xl font-bold tracking-tight">学習</h2>
        <p className="text-muted-foreground mt-2">問題が見つかりません。</p>
      </div>
    );
  }

  const current = session.queue[session.cursor];
  if (!current) return null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{PHASE_LABELS_JA[descriptor.phase]}</h2>
        <p className="text-muted-foreground">教材 #{descriptor.materialId}</p>
      </div>
      {descriptor.phase === 'listening' && (
        <ListeningPlaybackHeader materialId={descriptor.materialId} />
      )}
      {(descriptor.phase === 'vocab' || descriptor.phase === 'review') && (
        <VocabQuestion
          question={current}
          index={session.cursor}
          total={session.queue.length}
          onAnswer={session.answer}
        />
      )}
      {descriptor.phase === 'listening' && (
        <ListeningQuestion
          question={current}
          index={session.cursor}
          total={session.queue.length}
          onAnswer={session.answer}
        />
      )}
      {descriptor.phase === 'dictation' && (
        <DictationInput
          question={current}
          index={session.cursor}
          total={session.queue.length}
          onAnswer={session.answer}
        />
      )}
      {descriptor.phase === 'speaking' && (
        <SpeakingPrompt
          question={current}
          index={session.cursor}
          total={session.queue.length}
          onAnswer={session.answer}
        />
      )}
      {descriptor.phase === 'retention' && (
        <RetentionPrompt
          question={current}
          index={session.cursor}
          total={session.queue.length}
          onAnswer={session.answer}
        />
      )}
    </div>
  );
}

function ListeningPlaybackHeader({ materialId }: { materialId: number }) {
  const [script, setScript] = useState<string | null>(null);
  useEffect(() => {
    call('db:material.get', { id: materialId }).then((m) => setScript(m?.script ?? null));
  }, [materialId]);
  if (!script) return null;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">教材の再生</CardTitle>
        <CardDescription>2〜3 回聞いて、内容を把握してから問題に進んでください</CardDescription>
      </CardHeader>
      <CardContent>
        <VoicePlayer text={script} label="スクリプト再生" />
      </CardContent>
    </Card>
  );
}

function isSupportedPhase(phase: PhaseName): phase is SupportedPhase {
  return (
    phase === 'vocab' ||
    phase === 'listening' ||
    phase === 'dictation' ||
    phase === 'shadowing' ||
    phase === 'speaking' ||
    phase === 'retention' ||
    phase === 'review'
  );
}
