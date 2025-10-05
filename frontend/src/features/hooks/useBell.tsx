import { useEffect, useRef, useCallback } from "react";

export function useBell() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const ensureAudioContext = useCallback(async () => {
    if (!audioCtxRef.current) {
      const AudioCtx =
        window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === "suspended") {
      await audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const playBell = useCallback(async () => {
    const audioCtx = await ensureAudioContext();
    if (!audioCtx) return;

    const duration = 1.5;
    const baseFreq = 880;
    const now = audioCtx.currentTime;

    const master = audioCtx.createGain();
    master.gain.value = 0.5;
    master.connect(audioCtx.destination);

    const bellPartials = [
      { freqMul: 1.0, gain: 1.0 },
      { freqMul: 2.0, gain: 0.5 },
      { freqMul: 3.0, gain: 0.25 },
    ];

    bellPartials.forEach(({ freqMul, gain }) => {
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(baseFreq * freqMul, now);
      g.gain.setValueAtTime(gain, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(g);
      g.connect(master);
      osc.start(now);
      osc.stop(now + duration);
    });
  }, [ensureAudioContext]);

  useEffect(() => {
    return () => {
      audioCtxRef.current?.close();
      audioCtxRef.current = null;
    };
  }, []);

  return playBell;
}
