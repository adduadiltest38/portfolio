import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const html = document.documentElement;
const reduced = html.classList.contains('reduced');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => Array.from(r.querySelectorAll<T>(s));

let lenis: Lenis | null = null;

/* ------------------------------------------------------------------ utils */

/** Wrap every word of `el` in `.w > .wi` (keeps nested inline elements). */
function splitWords(el: HTMLElement, cls = 'w'): HTMLElement[] {
  const out: HTMLElement[] = [];
  const walk = (node: Node) => {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        (child.textContent ?? '').split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) return frag.appendChild(document.createTextNode(' '));
          const w = document.createElement('span');
          w.className = cls;
          if (cls === 'w') {
            const i = document.createElement('span');
            i.className = 'wi';
            i.textContent = part;
            w.appendChild(i);
            out.push(i);
          } else {
            w.textContent = part;
            out.push(w);
          }
          frag.appendChild(w);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE && (child as Element).tagName !== 'BR') {
        walk(child);
      }
    });
  };
  walk(el);
  return out;
}

/* ------------------------------------------------------- always-on bits */

function clock() {
  const els = $$('[data-clock]');
  if (!els.length) return;
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dubai', hour: '2-digit', minute: '2-digit' });
  const tick = () => els.forEach((e) => (e.textContent = fmt.format(new Date())));
  tick();
  window.setInterval(tick, 10_000);
}

function menu() {
  const btn = $('[data-menu-btn]');
  if (!btn) return;
  const set = (open: boolean) => {
    html.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (open) lenis?.stop();
    else lenis?.start();
  };
  btn.addEventListener('click', () => set(!html.classList.contains('menu-open')));
  $$('[data-menu-link]').forEach((a) => a.addEventListener('click', () => set(false)));
  document.addEventListener('keydown', (e) => e.key === 'Escape' && set(false));
}

function copyEmail() {
  const a = $<HTMLAnchorElement>('[data-copy-email]');
  const note = $('[data-copied]');
  if (!a || !note) return;
  a.addEventListener('click', () => {
    navigator.clipboard?.writeText(a.dataset.copyEmail ?? '').then(() => {
      note.classList.add('show');
      window.setTimeout(() => note.classList.remove('show'), 2200);
    }).catch(() => {});
  });
}

function heroShapeSync() {
  const words = $$('[data-shape-word]');
  const label = $('[data-shape-label]');
  const names = ['LLM core', 'Voice AI', 'P&ID → 3D'];
  window.addEventListener('hero:shape', (e) => {
    const i = (e as CustomEvent<number>).detail;
    words.forEach((w) => w.classList.toggle('is-on', Number(w.dataset.shapeWord) === i));
    if (label) label.innerHTML = `<b>0${i + 1}</b> / 03 — ${names[i].replace('&', '&amp;')}`;
  });
}

function navState() {
  const nav = $('[data-nav]');
  if (!nav) return;
  let lastY = window.scrollY;
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('is-scrolled', y > 40);
    const hide = y > lastY && y > window.innerHeight * 0.6 && !html.classList.contains('menu-open');
    nav.classList.toggle('is-hidden', hide);
    lastY = y;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const links = $$<HTMLAnchorElement>('[data-navlink]');
  links.forEach((a) => {
    const target = $(a.getAttribute('href') ?? '');
    if (!target) return;
    ScrollTrigger.create({
      trigger: target,
      start: 'top 50%',
      end: 'bottom 50%',
      onToggle: (self) => self.isActive && links.forEach((l) => l.classList.toggle('is-active', l === a)),
    });
  });
}

function anchors() {
  $$<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href') ?? '';
      const target = id === '#top' ? document.body : $(id);
      if (!target || !lenis) return;
      e.preventDefault();
      lenis.scrollTo(target as HTMLElement, { offset: 0, duration: 1.4 });
      history.replaceState(null, '', id);
    });
  });
}

/* ----------------------------------------------------------- preloader */

function intro(): Promise<void> {
  const pre = $('.preloader');
  const heroLines = $$('[data-hero-line]');
  const heroFade = $$('[data-hero-fade]');
  const canvas = $('[data-hero-canvas]');

  return new Promise((resolve) => {
    if (!pre || reduced) {
      pre?.remove();
      return resolve();
    }
    lenis?.stop();
    const count = $('[data-pl-count]', pre)!;
    const logs = $$('[data-pl-log]', pre);
    const bar = $('.pl-bar i', pre)!;
    const n = { v: 0 };

    gsap.set(heroLines, { yPercent: 110 });
    gsap.set(heroFade, { autoAlpha: 0, y: 24 });
    gsap.set(canvas, { autoAlpha: 0, scale: 1.08 });
    gsap.set(logs, { autoAlpha: 0, x: 12 });

    const tl = gsap.timeline({
      onComplete: () => {
        pre.remove();
        lenis?.start();
        resolve();
      },
    });
    tl.to(n, {
      v: 100, duration: 1.6, ease: 'power2.inOut',
      onUpdate: () => (count.textContent = String(Math.round(n.v)).padStart(3, '0')),
    })
      .to(bar, { scaleX: 1, duration: 1.6, ease: 'power2.inOut' }, 0)
      .to(logs, { autoAlpha: 1, x: 0, stagger: 0.4, duration: 0.4 }, 0.1)
      .to(pre, { clipPath: 'inset(0 0 100% 0)', duration: 0.9, ease: 'expo.inOut' }, '+=0.1')
      .to(canvas, { autoAlpha: 1, scale: 1, duration: 1.8, ease: 'expo.out' }, '-=0.4')
      .to(heroLines, { yPercent: 0, duration: 1.2, stagger: 0.1, ease: 'expo.out' }, '<')
      .to(heroFade, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.08, ease: 'expo.out' }, '<0.3');
  });
}

/* ------------------------------------------------------ scroll motion */

function scrollMotion() {
  // Hero parallax out
  const hero = $('.hero');
  if (hero) {
    gsap.to('.hero-title', { yPercent: -18, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('[data-hero-canvas]', { autoAlpha: 0.15, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
  }

  // Split headings
  $$('[data-split]').forEach((el) => {
    const words = splitWords(el);
    gsap.from(words, {
      yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.06,
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    });
  });

  // Generic reveals
  const reveals = $$('[data-reveal]');
  gsap.set(reveals, { autoAlpha: 0, y: 40 });
  ScrollTrigger.batch(reveals, {
    start: 'top 88%',
    once: true,
    onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.08, overwrite: true }),
  });

  // Manifesto words light up as you scroll
  $$('[data-scrub-words]').forEach((el) => {
    const words = splitWords(el, 'sw');
    gsap.to(words, {
      opacity: 1, ease: 'none', stagger: 0.1,
      scrollTrigger: { trigger: el, start: 'top 78%', end: 'bottom 52%', scrub: 0.6 },
    });
  });

  // Counters
  $$('[data-count]').forEach((el) => {
    const end = Number(el.dataset.count);
    const o = { v: 0 };
    el.textContent = '0';
    gsap.to(o, {
      v: end, duration: 1.6, ease: 'power3.out',
      onUpdate: () => (el.textContent = String(Math.round(o.v))),
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });

  // Marquee — speeds up with scroll velocity and follows scroll direction
  const track = $('[data-marquee] .marquee-track');
  if (track) {
    const loop = gsap.to(track, { xPercent: -50, duration: 38, ease: 'none', repeat: -1 });
    let dir = 1;
    ScrollTrigger.create({
      onUpdate: (self) => {
        dir = self.direction;
        const v = Math.min(Math.abs(self.getVelocity()) / 250, 6);
        gsap.to(loop, { timeScale: dir * (1 + v), duration: 0.2, overwrite: true });
        gsap.to(loop, { timeScale: dir, duration: 1.2, delay: 0.25, overwrite: false });
      },
    });
  }

  const mm = gsap.matchMedia();

  // Capabilities — horizontal scroll on wide screens
  mm.add('(min-width: 900px)', () => {
    const pin = $('[data-caps]');
    const capsTrack = $('[data-caps-track]');
    const progress = $('[data-caps-progress]');
    if (!pin || !capsTrack) return;
    const dist = () => Math.max(0, capsTrack.scrollWidth - window.innerWidth);
    gsap.to(capsTrack, {
      x: () => -dist(),
      ease: 'none',
      scrollTrigger: {
        trigger: pin,
        start: 'center 52%',
        end: () => `+=${dist()}`,
        pin: true,
        scrub: 0.8,
        invalidateOnRefresh: true,
        onUpdate: (self) => progress && gsap.set(progress, { scaleX: self.progress }),
      },
    });
  });

  // Work — stacked cards recede as the next one slides over
  mm.add('(min-width: 961px)', () => {
    const cases = $$('[data-case]');
    cases.forEach((card, i) => {
      const next = cases[i + 1];
      if (!next) return;
      gsap.to(card, {
        scale: 0.93, filter: 'brightness(0.55)', ease: 'none',
        scrollTrigger: { trigger: next, start: 'top bottom', end: 'top 20%', scrub: true },
      });
    });
  });

  // Research — latency race
  const race = $('[data-race]');
  if (race) {
    const lBar = $('[data-race-bar="laya"]', race);
    const hBar = $('[data-race-bar="human"]', race);
    const lTime = $('[data-race-time="laya"]', race)!;
    const hTime = $('[data-race-time="human"]', race)!;
    const t = { l: 0, h: 0 };
    const tl = gsap.timeline({ scrollTrigger: { trigger: race, start: 'top 75%', once: true } });
    tl.to(lBar, { scaleX: 1, duration: 0.25, ease: 'power4.out' })
      .to(t, { l: 34, duration: 0.25, onUpdate: () => (lTime.textContent = String(Math.round(t.l))), onComplete: () => (lTime.textContent = '<35') }, 0)
      .to(hBar, { scaleX: 1, duration: 4.2, ease: 'none' }, 0)
      .to(t, { h: 8.5, duration: 4.2, ease: 'none', onUpdate: () => (hTime.textContent = t.h.toFixed(1)), onComplete: () => (hTime.textContent = '~8.5') }, 0);
  }

  // Research — signal pulse along the pipeline
  const pulse = $('[data-pipe-pulse]');
  if (pulse) {
    mm.add('(min-width: 861px)', () => {
      gsap.fromTo(pulse, { x: -140 }, { x: () => (pulse.parentElement?.offsetWidth ?? 800) + 20, duration: 2.4, ease: 'power1.in', repeat: -1, repeatDelay: 0.4 });
    });
    mm.add('(max-width: 860px)', () => {
      gsap.fromTo(pulse, { y: -140 }, { y: () => (pulse.parentElement?.offsetHeight ?? 600) + 20, duration: 2.8, ease: 'power1.in', repeat: -1, repeatDelay: 0.4 });
    });
  }

  // Experience timeline progress
  const tlLine = $('[data-tl-progress]');
  if (tlLine) {
    gsap.to(tlLine, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '[data-timeline]', start: 'top 70%', end: 'bottom 70%', scrub: true } });
  }

  // Footer name rises in
  gsap.from('.footer-name', { yPercent: 40, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });
}

/* ---------------------------------------------------- cursor + magnets */

function cursor() {
  const c = $('.cursor');
  if (!c || !finePointer) return;
  document.body.classList.add('has-cursor');
  const dot = $('.cursor-dot', c)!;
  const ring = $('.cursor-ring', c)!;
  const label = $('[data-cursor-label]', c)!;
  const dx = gsap.quickTo(dot, 'x', { duration: 0.08 });
  const dy = gsap.quickTo(dot, 'y', { duration: 0.08 });
  const rx = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' });
  const ry = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' });
  gsap.set([dot, ring], { xPercent: -50, yPercent: -50 });
  window.addEventListener('pointermove', (e) => { c.classList.add('is-on'); dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); }, { passive: true });
  document.addEventListener('pointerover', (e) => {
    const t = e.target as HTMLElement;
    const labelled = t.closest<HTMLElement>('[data-cursor]');
    const link = t.closest('a, button');
    c.classList.toggle('is-label', !!labelled && !link);
    c.classList.toggle('is-link', !!link);
    if (labelled && !link) label.textContent = labelled.dataset.cursor ?? '';
  });
  document.documentElement.addEventListener('pointerleave', () => c.classList.remove('is-on'));
}

function magnets() {
  if (!finePointer) return;
  $$('[data-magnetic]').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * 0.28);
      yTo((e.clientY - (r.top + r.height / 2)) * 0.38);
    });
    el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
  });
}

/* ---------------------------------------------------------------- boot */

async function boot() {
  clock();
  copyEmail();
  heroShapeSync();

  if (!reduced) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis?.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    anchors();
  }
  menu();

  await intro();
  navState();

  if (!reduced) {
    scrollMotion();
    cursor();
    magnets();
  }

  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh());
}

boot();
