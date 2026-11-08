import type { CSSProperties } from 'react';
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

/**
 * Remotion composition: "The Industrial Reflex" — a time-dilated replay of the
 * Laya edge-AI simulation. 1280×720 @ 30fps, 330 frames, loops seamlessly.
 *
 *   0–40    SCADA telemetry, pressure spike → alarm
 *   30–160  System 1 reflex pipeline, sim clock 0 → 34 ms, valve closes
 *   165–265 System 2: local LLM drafts an advisory action plan
 *   265–330 Result card
 */

export const REFLEX = { width: 1280, height: 720, fps: 30, durationInFrames: 330 };

const C = {
  bg: '#060606',
  panel: '#111113',
  line: 'rgba(237,234,227,0.12)',
  ink: '#edeae3',
  muted: '#8e8a82',
  dim: '#5d5a54',
  accent: '#ff5a1f',
  signal: '#b6f23e',
  danger: '#ff3b3b',
};
const mono: CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace", letterSpacing: '0.06em', textTransform: 'uppercase' };
const display: CSSProperties = { fontFamily: "'Archivo', system-ui, sans-serif", fontVariationSettings: "'wdth' 125", fontWeight: 900, letterSpacing: '-0.04em', textTransform: 'uppercase' };

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

const STAGES = [
  { at: 0, t: '0 ms', title: 'SCADA', sub: 'Modbus / OPC UA telemetry' },
  { at: 2, t: '< 2 ms', title: 'Translate', sub: 'Local protocol translation' },
  { at: 33, t: '~ 33 ms', title: 'Reflex model', sub: 'Parallel small-model inference' },
  { at: 34, t: '< 35 ms', title: 'Decision', sub: 'Shutdown valve command' },
];

const PLAN = [
  '1  Confirm SDV-201 closed on HMI',
  '2  Hold hot-work permits in Zone B',
  '3  Dispatch technician with gas detector',
  '4  Draft incident report for review',
];

function Telemetry({ frame }: { frame: number }) {
  // pressure trace — calm, then a spike around frame 22
  const pts: string[] = [];
  const W = 520;
  const H = 120;
  for (let i = 0; i <= 80; i++) {
    const x = (i / 80) * W;
    const noise = Math.sin(i * 1.7) * 3 + Math.sin(i * 0.6 + 1) * 4;
    const spikeX = 62;
    const spike = i > spikeX ? Math.min((i - spikeX) * 7, 78) : 0;
    pts.push(`${x.toFixed(1)},${(H - 30 - noise - spike).toFixed(1)}`);
  }
  const reveal = interpolate(frame, [0, 26], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  const alarm = frame > 22;
  const blink = alarm ? (Math.floor(frame / 6) % 2 === 0 ? 1 : 0.55) : 0;
  return (
    <div style={{ position: 'absolute', left: 64, top: 96, width: W }}>
      <div style={{ ...mono, fontSize: 13, color: C.muted, display: 'flex', justifyContent: 'space-between' }}>
        <span>PT-101 · Separator pressure</span>
        <span style={{ color: alarm ? C.danger : C.signal }}>{alarm ? '▲ High-high' : '● Normal'}</span>
      </div>
      <svg width={W} height={H} style={{ marginTop: 10, overflow: 'visible' }}>
        <line x1={0} x2={W} y1={H - 92} y2={H - 92} stroke={C.danger} strokeDasharray="4 6" opacity={0.6} />
        <text x={W} y={H - 98} fill={C.danger} fontSize={11} textAnchor="end" style={mono}>trip setpoint</text>
        <clipPath id="tclip"><rect x={0} y={-40} width={W * reveal} height={H + 60} /></clipPath>
        <polyline points={pts.join(' ')} fill="none" stroke={alarm ? C.accent : C.ink} strokeWidth={2.5} clipPath="url(#tclip)" />
      </svg>
      <div
        style={{
          ...mono, marginTop: 14, fontSize: 14, display: 'inline-flex', gap: 10, alignItems: 'center',
          padding: '8px 14px', borderRadius: 8, border: `1px solid ${C.danger}`, color: C.danger, opacity: blink,
        }}
      >
        ⚠ Alarm · possible gas release · conf 0.93
      </div>
    </div>
  );
}

export function ReflexSim() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // simulated clock: frames 40..150 → 0..34 ms (≈115× time dilation)
  const simMs = interpolate(frame, [40, 150], [0, 34], clamp);
  const pipelineIn = spring({ frame: frame - 28, fps, config: { damping: 200 } });
  const decided = frame >= 150;
  const stamp = spring({ frame: frame - 150, fps, config: { damping: 12, stiffness: 160 } });

  const s2 = interpolate(frame, [165, 185], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const s2out = interpolate(frame, [258, 270], [1, 0], clamp);
  const typed = Math.max(0, Math.floor((frame - 190) * 1.6));

  const result = spring({ frame: frame - 268, fps, config: { damping: 200 } });
  const loopFade = interpolate(frame, [0, 8, 318, 330], [0, 1, 1, 0], clamp);
  const mainOut = interpolate(frame, [160, 178], [1, 0.12], clamp);

  const operatorPct = (simMs / 8500) * 100;

  let chars = typed;
  const planLines = PLAN.map((l) => {
    const shown = l.slice(0, Math.max(0, chars));
    chars -= l.length + 4;
    return shown;
  });

  return (
    <AbsoluteFill style={{ background: C.bg, color: C.ink, opacity: loopFade, overflow: 'hidden' }}>
      {/* dot grid */}
      <AbsoluteFill style={{ backgroundImage: `radial-gradient(${C.line} 1px, transparent 1px)`, backgroundSize: '24px 24px', opacity: 0.6 }} />

      {/* top bar */}
      <div style={{ ...mono, position: 'absolute', left: 64, right: 64, top: 40, fontSize: 13, display: 'flex', justifyContent: 'space-between', color: C.muted }}>
        <span><span style={{ color: C.accent }}>●</span>&nbsp; Laya · edge simulation · offline</span>
        <span>Time dilated ≈115×</span>
      </div>

      <div style={{ opacity: mainOut }}>
        <Telemetry frame={frame} />

        {/* sim clock */}
        <div style={{ position: 'absolute', right: 64, top: 92, textAlign: 'right' }}>
          <div style={{ ...mono, fontSize: 13, color: C.muted }}>Sim clock</div>
          <div style={{ ...display, fontSize: 132, lineHeight: 0.9, color: decided ? C.accent : C.ink, fontVariantNumeric: 'tabular-nums' }}>
            {simMs.toFixed(simMs < 10 ? 1 : 0)}
            <span style={{ fontSize: 44, color: C.accent, marginLeft: 6 }}>ms</span>
          </div>
        </div>

        {/* pipeline */}
        <div style={{ position: 'absolute', left: 64, right: 64, top: 340, opacity: pipelineIn, transform: `translateY(${(1 - pipelineIn) * 30}px)` }}>
          <div style={{ position: 'absolute', left: 9, right: 9, top: 9, height: 2, background: C.line }} />
          <div
            style={{
              position: 'absolute', left: 9, top: 9, height: 2, background: C.accent,
              width: `calc((100% - 18px) * ${interpolate(simMs, [0, 2, 33, 34], [0, 0.333, 0.667, 1], clamp)})`,
              boxShadow: `0 0 18px ${C.accent}`,
            }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
            {STAGES.map((s, i) => {
              const on = frame >= 40 && simMs >= s.at;
              return (
                <div key={s.title} style={{ paddingTop: 36, position: 'relative' }}>
                  <div
                    style={{
                      position: 'absolute', top: 0, left: 0, width: 20, height: 20, borderRadius: 10,
                      background: on ? C.accent : C.bg, border: `2px solid ${on ? C.accent : C.dim}`,
                      boxShadow: on ? `0 0 0 6px rgba(255,90,31,0.18)` : 'none',
                    }}
                  />
                  <div style={{ ...mono, fontSize: 13, color: on ? C.accent : C.dim }}>{s.t}</div>
                  <div style={{ ...display, fontSize: 26, marginTop: 8, whiteSpace: 'nowrap', color: on ? C.ink : C.dim }}>{s.title}</div>
                  <div style={{ fontFamily: 'Archivo, sans-serif', fontSize: 17, color: C.muted, marginTop: 6 }}>{s.sub}</div>
                  {i === 3 && (
                    <div
                      style={{
                        ...mono, marginTop: 16, display: 'inline-block', padding: '10px 14px', borderRadius: 8, fontSize: 15,
                        background: C.accent, color: '#120601', transform: `scale(${decided ? stamp : 0}) rotate(-3deg)`,
                      }}
                    >
                      SDV-201 · CLOSE ✓
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* operator lane */}
        <div style={{ position: 'absolute', left: 64, right: 64, bottom: 56, opacity: pipelineIn }}>
          <div style={{ ...mono, fontSize: 13, color: C.muted, display: 'flex', justifyContent: 'space-between' }}>
            <span>Typical human operator response · ~8.5 s</span>
            <span style={{ color: C.ink }}>{operatorPct.toFixed(2)}% elapsed</span>
          </div>
          <div style={{ marginTop: 10, height: 10, borderRadius: 5, background: '#1b1b1f', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.max(operatorPct, 0.15)}%`, background: C.ink }} />
          </div>
        </div>
      </div>

      {/* System 2 overlay */}
      <div
        style={{
          position: 'absolute', left: 140, right: 140, top: 110, bottom: 90, borderRadius: 22, border: `1px solid ${C.line}`,
          background: C.panel, padding: 44, opacity: s2 * s2out, transform: `translateY(${(1 - s2) * 40}px) scale(${0.97 + s2 * 0.03})`,
          display: 'grid', gridTemplateColumns: '1fr 1.25fr', gap: 44,
        }}
      >
        <div>
          <div style={{ ...mono, fontSize: 13, color: C.accent }}>System 2 · reasoning layer</div>
          <div style={{ ...display, fontSize: 52, lineHeight: 0.95, marginTop: 16 }}>Local LLM, grounded in site procedures</div>
          <div style={{ fontFamily: 'Archivo, sans-serif', fontSize: 19, color: C.muted, marginTop: 20, lineHeight: 1.45 }}>
            Only complex questions escalate. A step-by-step plan goes to the technician’s tablet.
          </div>
          <div style={{ ...mono, fontSize: 12, marginTop: 26, display: 'inline-block', padding: '8px 12px', borderRadius: 999, border: `1px solid ${C.signal}`, color: C.signal }}>
            Advisory · human makes the final call
          </div>
        </div>
        <div style={{ borderRadius: 18, border: `1px solid ${C.line}`, background: C.bg, padding: 28 }}>
          <div style={{ ...mono, fontSize: 12, color: C.dim, display: 'flex', justifyContent: 'space-between' }}>
            <span>Technician tablet</span>
            <span style={{ color: C.signal }}>● offline</span>
          </div>
          <div style={{ ...mono, fontSize: 12, color: C.muted, marginTop: 22 }}>Action plan · PT-101 high-high</div>
          <div style={{ marginTop: 14, display: 'grid', gap: 14 }}>
            {planLines.map((l, i) => (
              <div key={i} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, color: C.ink, minHeight: 26, whiteSpace: 'pre' }}>
                {l}
                {l.length > 0 && l.length < PLAN[i].length && <span style={{ color: C.accent }}>▍</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Result */}
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', opacity: result, transform: `translateY(${(1 - result) * 30}px)` }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 64 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ ...display, fontSize: 168, lineHeight: 0.85, color: C.accent }}>&lt;35<span style={{ fontSize: 60 }}>ms</span></div>
            <div style={{ ...mono, fontSize: 14, color: C.muted, marginTop: 18 }}>Laya reflex decision</div>
          </div>
          <div style={{ ...mono, fontSize: 20, color: C.dim, paddingBottom: 48 }}>vs</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ ...display, fontSize: 168, lineHeight: 0.85, color: C.ink, opacity: 0.35 }}>~8.5<span style={{ fontSize: 60 }}>s</span></div>
            <div style={{ ...mono, fontSize: 14, color: C.muted, marginTop: 18 }}>Typical operator response</div>
          </div>
        </div>
        <div style={{ ...mono, fontSize: 14, color: C.ink, marginTop: 48, padding: '10px 18px', border: `1px solid ${C.line}`, borderRadius: 999 }}>
          ≈240× faster · in simulation · fully offline
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
