import { Player, type PlayerRef } from '@remotion/player';
import { useEffect, useRef, useState } from 'react';
import { REFLEX, ReflexSim } from './ReflexSim';

export default function ReflexPlayer() {
  const ref = useRef<PlayerRef>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const [reduced] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // Only play while on screen — saves CPU/battery.
  useEffect(() => {
    if (reduced || !wrap.current) return;
    const io = new IntersectionObserver(
      ([e]) => {
        const p = ref.current;
        if (!p) return;
        if (e.isIntersecting) p.play();
        else p.pause();
      },
      { threshold: 0.25 },
    );
    io.observe(wrap.current);
    return () => io.disconnect();
  }, [reduced]);

  return (
    <div ref={wrap} className="player" data-cursor="Replay" onClick={() => ref.current?.seekTo(0)}>
      <Player
        ref={ref}
        component={ReflexSim}
        durationInFrames={REFLEX.durationInFrames}
        fps={REFLEX.fps}
        compositionWidth={REFLEX.width}
        compositionHeight={REFLEX.height}
        style={{ width: '100%', height: '100%' }}
        loop
        autoPlay={false}
        controls={reduced}
        clickToPlay={false}
        initialFrame={reduced ? 290 : 0}
        acknowledgeRemotionLicense
      />
    </div>
  );
}
