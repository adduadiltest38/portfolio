import { useEffect, useRef } from 'react';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Group,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
} from 'three';

/**
 * Hero particle field. One point cloud morphs between three shapes that map to
 * the three things Abdula builds: an LLM "core", a voice waveform, and a 3D
 * pipe/vessel network (P&ID → 3D). Dispatches `hero:shape` so the hero copy can
 * highlight the matching word.
 */

type Vec = [number, number, number];

const rand = (seed: number) => {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

function coreShape(n: number, r: () => number): Float32Array {
  const out = new Float32Array(n * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  const sphereN = Math.floor(n * 0.62);
  for (let i = 0; i < n; i++) {
    let p: Vec;
    if (i < sphereN) {
      const y = 1 - (i / (sphereN - 1)) * 2;
      const rad = Math.sqrt(1 - y * y);
      const th = golden * i;
      const R = 1.55 + (r() - 0.5) * 0.06;
      p = [Math.cos(th) * rad * R, y * R, Math.sin(th) * rad * R];
    } else if (i < n * 0.86) {
      // two tilted orbital rings
      const a = r() * Math.PI * 2;
      const ring = i % 2;
      const R = ring ? 2.35 : 2.0;
      const tilt = ring ? 1.1 : -0.55;
      const x = Math.cos(a) * R;
      const z = Math.sin(a) * R;
      p = [x, z * Math.sin(tilt) + (r() - 0.5) * 0.04, z * Math.cos(tilt)];
    } else {
      // inner nucleus
      const u = r() * Math.PI * 2;
      const v = Math.acos(2 * r() - 1);
      const R = Math.cbrt(r()) * 0.75;
      p = [R * Math.sin(v) * Math.cos(u), R * Math.cos(v), R * Math.sin(v) * Math.sin(u)];
    }
    out.set(p, i * 3);
  }
  return out;
}

function voiceShape(n: number, r: () => number): Float32Array {
  const out = new Float32Array(n * 3);
  const lines = 14;
  for (let i = 0; i < n; i++) {
    const line = i % lines;
    const x = (r() - 0.5) * 6.4;
    const z = (line / (lines - 1) - 0.5) * 2.2;
    // speech-like envelope: a few syllable bumps
    const env =
      Math.exp(-Math.pow((x + 1.6) / 0.55, 2)) * 0.9 +
      Math.exp(-Math.pow((x - 0.1) / 0.75, 2)) * 1.25 +
      Math.exp(-Math.pow((x - 1.9) / 0.5, 2)) * 0.7;
    const phase = line * 0.35;
    const y = Math.sin(x * 6.0 + phase) * env * 0.85 * (1 - Math.abs(z) * 0.25) + (r() - 0.5) * 0.03;
    out.set([x, y, z], i * 3);
  }
  return out;
}

function pipeShape(n: number, r: () => number): Float32Array {
  // Equipment as cylinders: [start, end, radius]. Rough plant layout around origin.
  const segs: { a: Vec; b: Vec; rad: number }[] = [
    { a: [-1.9, -1.2, 0], b: [-1.9, 1.1, 0], rad: 0.55 }, // vessel V-101
    { a: [-1.9, -1.0, 0], b: [0.2, -1.0, 0], rad: 0.1 }, // outlet line
    { a: [0.2, -1.0, 0], b: [0.2, -1.0, 0.9], rad: 0.1 }, // elbow out
    { a: [0.2, -1.0, 0.9], b: [1.1, -1.0, 0.9], rad: 0.1 },
    { a: [1.1, -1.25, 0.9], b: [1.1, -0.75, 0.9], rad: 0.32 }, // pump P-204 (short)
    { a: [1.1, -0.75, 0.9], b: [1.1, 0.9, 0.9], rad: 0.1 }, // riser
    { a: [1.1, 0.9, 0.9], b: [1.1, 0.9, -0.6], rad: 0.1 },
    { a: [1.1, 0.9, -0.6], b: [2.3, 0.9, -0.6], rad: 0.1 },
    { a: [2.3, 0.2, -0.6], b: [2.3, 1.6, -0.6], rad: 0.4 }, // exchanger / column
    { a: [-1.9, 1.1, 0], b: [-1.9, 1.6, 0], rad: 0.1 }, // vent
    { a: [-1.9, 1.6, 0], b: [0.6, 1.6, 0], rad: 0.08 }, // overhead line
    { a: [-0.5, -1.0, 0], b: [-0.5, -1.0, -0.9], rad: 0.08 }, // branch
    { a: [-0.5, -1.0, -0.9], b: [0.8, -1.0, -0.9], rad: 0.08 },
  ];
  const areas = segs.map((s) => {
    const len = Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1], s.b[2] - s.a[2]);
    return Math.max(len, 0.001) * s.rad * 2 * Math.PI + (s.rad > 0.2 ? s.rad * s.rad * Math.PI * 2 : 0);
  });
  const total = areas.reduce((a, b) => a + b, 0);
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    let pick = r() * total;
    let k = 0;
    while (pick > areas[k] && k < segs.length - 1) pick -= areas[k++];
    const s = segs[k];
    const d: Vec = [s.b[0] - s.a[0], s.b[1] - s.a[1], s.b[2] - s.a[2]];
    const len = Math.hypot(...d) || 1;
    const dir: Vec = [d[0] / len, d[1] / len, d[2] / len];
    // orthonormal basis around dir
    const up: Vec = Math.abs(dir[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
    const u: Vec = [dir[1] * up[2] - dir[2] * up[1], dir[2] * up[0] - dir[0] * up[2], dir[0] * up[1] - dir[1] * up[0]];
    const ul = Math.hypot(...u);
    u[0] /= ul; u[1] /= ul; u[2] /= ul;
    const v: Vec = [dir[1] * u[2] - dir[2] * u[1], dir[2] * u[0] - dir[0] * u[2], dir[0] * u[1] - dir[1] * u[0]];
    const ang = r() * Math.PI * 2;
    let t = r();
    let rad = s.rad;
    // big vessels: put some points on end caps
    if (s.rad > 0.2 && r() < 0.22) {
      t = r() < 0.5 ? 0 : 1;
      rad = s.rad * Math.sqrt(r());
    }
    const c = Math.cos(ang) * rad;
    const sn = Math.sin(ang) * rad;
    out.set(
      [
        s.a[0] + d[0] * t + u[0] * c + v[0] * sn,
        s.a[1] + d[1] * t + u[1] * c + v[1] * sn,
        s.a[2] + d[2] * t + u[2] * c + v[2] * sn,
      ],
      i * 3,
    );
  }
  return out;
}

const vertex = /* glsl */ `
  attribute vec3 aTo;
  attribute float aRand;
  uniform float uMix;
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uWave;
  varying float vRand;
  varying float vDepth;

  void main() {
    float t = clamp((uMix - aRand * 0.35) / 0.65, 0.0, 1.0);
    t = t * t * (3.0 - 2.0 * t);
    vec3 p = mix(position, aTo, t);
    float burst = sin(t * 3.14159);
    p += normalize(p + vec3(0.0001)) * burst * (0.25 + aRand * 0.6);
    p.x += sin(uTime * 0.7 + aRand * 40.0) * 0.012;
    p.y += cos(uTime * 0.6 + aRand * 31.0) * 0.012;
    float env = smoothstep(3.4, 0.4, abs(p.x));
    p.y += uWave * sin(p.x * 3.2 - uTime * 3.4 + p.z * 1.8) * 0.16 * env;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * uPixelRatio * (0.55 + aRand * 0.9) / -mv.z;
    vRand = aRand;
    vDepth = smoothstep(-11.0, -4.0, mv.z);
  }
`;

const fragment = /* glsl */ `
  varying float vRand;
  varying float vDepth;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.0, d);
    vec3 bone = vec3(0.93, 0.92, 0.89);
    vec3 orange = vec3(1.0, 0.353, 0.122);
    vec3 col = mix(bone, orange, step(0.8, vRand));
    gl_FragColor = vec4(col, a * (0.25 + vDepth * 0.75) * (0.55 + vRand * 0.45));
  }
`;

export default function HeroScene() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return; // CSS gradient fallback stays

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mobile = window.matchMedia('(max-width: 760px)').matches;
    const N = mobile ? 4200 : 9000;
    const r = rand(7);
    const shapes = [coreShape(N, r), voiceShape(N, r), pipeShape(N, r)];

    const renderer = new WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' });
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(canvas);

    const scene = new Scene();
    const camera = new PerspectiveCamera(42, 1, 0.1, 50);
    camera.position.set(0, 0, 8.2);

    const geo = new BufferGeometry();
    const pos = new Float32Array(shapes[0]);
    const to = new Float32Array(shapes[1]);
    const rnd = new Float32Array(N);
    for (let i = 0; i < N; i++) rnd[i] = r();
    geo.setAttribute('position', new BufferAttribute(pos, 3));
    geo.setAttribute('aTo', new BufferAttribute(to, 3));
    geo.setAttribute('aRand', new BufferAttribute(rnd, 1));

    const uniforms = {
      uMix: { value: 0 },
      uTime: { value: 0 },
      uSize: { value: mobile ? 38 : 44 },
      uPixelRatio: { value: dpr },
      uWave: { value: 0 },
    };
    const mat = new ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    const points = new Points(geo, mat);
    const group = new Group();
    group.add(points);
    scene.add(group);

    const layout = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const wide = w / h > 1.1;
      group.position.set(wide ? 2.3 : 0, wide ? 0.35 : 0.9, 0);
      const s = wide ? 1 : Math.max(0.62, Math.min(1, w / h + 0.15));
      group.scale.setScalar(s);
    };
    layout();
    const ro = new ResizeObserver(layout);
    ro.observe(el);

    // morph cycle
    let current = 0;
    let morphStart = -1;
    const MORPH = 2.4;
    const HOLD = 4.2;
    let nextAt = HOLD;
    const announce = (i: number) => window.dispatchEvent(new CustomEvent('hero:shape', { detail: i }));
    announce(0);

    // pointer parallax
    const target = { x: 0, y: 0 };
    const onMove = (e: PointerEvent) => {
      target.x = (e.clientX / window.innerWidth - 0.5) * 2;
      target.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    let visible = true;
    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting), { threshold: 0 });
    io.observe(el);

    let raf = 0;
    let last = performance.now();
    let time = 0;
    let spin = 0;
    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!visible || document.hidden) return;
      time += dt;
      uniforms.uTime.value = time;

      if (morphStart < 0 && time >= nextAt) {
        const next = (current + 1) % shapes.length;
        to.set(shapes[next]);
        (geo.attributes.aTo as BufferAttribute).needsUpdate = true;
        morphStart = time;
        announce(next);
      }
      if (morphStart >= 0) {
        const k = Math.min((time - morphStart) / MORPH, 1);
        uniforms.uMix.value = ease(k);
        const next = (current + 1) % shapes.length;
        const wFrom = current === 1 ? 1 : 0;
        const wTo = next === 1 ? 1 : 0;
        uniforms.uWave.value = wFrom + (wTo - wFrom) * ease(k);
        if (k >= 1) {
          current = next;
          pos.set(shapes[current]);
          (geo.attributes.position as BufferAttribute).needsUpdate = true;
          uniforms.uMix.value = 0;
          morphStart = -1;
          nextAt = time + HOLD;
        }
      }

      const scrollK = Math.min(window.scrollY / window.innerHeight, 1.5);
      // auto-spin, but settle face-on while the voice waveform is showing
      const next = (current + 1) % shapes.length;
      const voiceOn = (current === 1 && morphStart < 0) || (next === 1 && morphStart >= 0);
      if (voiceOn) {
        const goal = Math.round(spin / Math.PI) * Math.PI;
        spin += (goal - spin) * Math.min(dt * 2.5, 1);
      } else {
        spin += dt * 0.14;
      }
      points.rotation.y = spin;
      group.rotation.y += (target.x * 0.35 - group.rotation.y) * 0.05;
      group.rotation.x += (0.18 + target.y * 0.2 + scrollK * 0.6 - group.rotation.x) * 0.05;
      camera.position.z = 8.2 + scrollK * 2.5;
      renderer.render(scene, camera);
    };

    if (reduced) {
      renderer.render(scene, camera);
    } else {
      raf = requestAnimationFrame(frame);
    }
    requestAnimationFrame(() => el.classList.add('is-ready'));

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
      geo.dispose();
      mat.dispose();
      renderer.dispose();
      canvas.remove();
    };
  }, []);

  return <div ref={host} style={{ position: 'absolute', inset: 0 }} aria-hidden="true" />;
}
