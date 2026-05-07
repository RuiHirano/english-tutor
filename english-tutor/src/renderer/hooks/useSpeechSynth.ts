import { useCallback, useEffect, useState } from 'react';

export interface SpeechSynthOptions {
  voice?: string;
  rate?: number;
  pitch?: number;
  lang?: string;
}

interface UseSpeechSynth {
  speak: (text: string, opts?: SpeechSynthOptions) => Promise<void>;
  cancel: () => void;
  speaking: boolean;
  voices: SpeechSynthesisVoice[];
}

export function useSpeechSynth(): UseSpeechSynth {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    const sync = () => setVoices(window.speechSynthesis.getVoices());
    sync();
    window.speechSynthesis.addEventListener('voiceschanged', sync);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', sync);
  }, []);

  const cancel = useCallback(() => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string, opts: SpeechSynthOptions = {}) =>
      new Promise<void>((resolve, reject) => {
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = opts.lang ?? 'en-US';
        if (opts.rate) utter.rate = opts.rate;
        if (opts.pitch) utter.pitch = opts.pitch;
        if (opts.voice) {
          const v = voices.find((vv) => vv.name === opts.voice);
          if (v) utter.voice = v;
        }
        utter.onstart = () => setSpeaking(true);
        utter.onend = () => {
          setSpeaking(false);
          resolve();
        };
        utter.onerror = (e) => {
          setSpeaking(false);
          reject(new Error(`Speech synthesis error: ${e.error}`));
        };
        window.speechSynthesis.speak(utter);
      }),
    [voices],
  );

  return { speak, cancel, speaking, voices };
}
