'use client';

import Link from 'next/link';
import { useEffect, useRef, type CSSProperties } from 'react';
import { BRAND } from '@/lib/config';

const LINES = ['Mirza’s', 'Natural Store'];
const W = 400, H = 560;
const cssVar = (name: string, value: string | number): CSSProperties => ({ [name]: value }) as CSSProperties;

/** Nested arches that draw themselves, drift with the mouse, and open like a doorway as you scroll. */
export function Hero() {
  const arches = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const layers = useRef<Array<SVGGElement | null>>([]);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let mx = window.innerWidth / 2, my = window.innerHeight / 2, lx = mx, ly = my, raf = 0;

    const onScroll = () => {
      const p = Math.min(window.scrollY / (window.innerHeight * 0.9), 1);
      arches.current?.style.setProperty('--sz', String(1 + p * 1.8));
      arches.current?.style.setProperty('--op', String(1 - p));
      title.current?.style.setProperty('--op', String(1 - p * 1.2));
      title.current?.style.setProperty('--ty', `${-p * 60}px`);
    };
    const onMove = (e: PointerEvent) => {
      mx = e.clientX; my = e.clientY;
      if (reduce || window.scrollY > window.innerHeight) return;
      title.current?.querySelectorAll<HTMLElement>('.ch').forEach((c) => {
        const r = c.getBoundingClientRect();
        const k = Math.max(0, 1 - Math.hypot(mx - (r.left + r.width / 2), my - (r.top + r.height / 2)) / 240);
        c.style.transform = k > 0 ? `translateY(${-k * 18}px) scale(${1 + k * 0.1})` : '';
        c.style.color = k > 0 ? `color-mix(in srgb, #cfa95a ${Math.round(k * 100)}%, #f3e9d8)` : '';
      });
    };
    const loop = () => {
      lx += (mx - lx) * 0.1; ly += (my - ly) * 0.1;
      const nx = lx / window.innerWidth - 0.5, ny = ly / window.innerHeight - 0.5;
      layers.current.forEach((g, i) => { if (g) { const d = (6 - i) * 7; g.style.transform = `translate(${nx * d}px, ${ny * d * 0.6}px)`; } });
      raf = requestAnimationFrame(loop);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pointermove', onMove);
    if (!reduce) loop();
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('pointermove', onMove); cancelAnimationFrame(raf); };
  }, []);

  return (
    <section className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-6 pb-10 pt-24 text-center">
      <div ref={arches} className="arches" aria-hidden>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax meet">
          <defs>
            <radialGradient id="core" cx="50%" cy="85%" r="75%"><stop offset="0" stopColor="#8c2f45" stopOpacity=".75" /><stop offset="1" stopColor="#0e0509" stopOpacity="0" /></radialGradient>
          </defs>
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const x = i * 30, w = W - 2 * x, r = w / 2;
            return (
              <g key={i} ref={(el) => { layers.current[i] = el; }}>
                <path className={i === 5 ? 'core' : undefined} style={cssVar('--i', i)} d={`M${x},${H} V${r} A${r},${r} 0 0 1 ${W - x},${r} V${H}`} />
              </g>
            );
          })}
        </svg>
      </div>

      <h1 ref={title} aria-label={BRAND} className="hero-title relative z-10 text-[clamp(44px,10.5vw,160px)]">
        {LINES.map((line, l) => (
          <span key={line} className="block whitespace-nowrap" aria-hidden>
            {[...line].map((c, i) => <span key={i} className="ch" style={cssVar('--i', i + l * 7)}>{c === ' ' ? '\u00a0' : c}</span>)}
          </span>
        ))}
      </h1>

      <div className="fade-up relative z-10 mt-6">
        <p className="mx-auto mb-7 max-w-md text-lg text-mute">Fine groceries from the old trade routes. Dates, saffron, honey and ghee, chosen by hand and wrapped like gifts.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/shop" className="btn-fill solid rounded-full border border-brass px-8 py-3.5 font-semibold">Explore the collection</Link>
          <Link href="/login" className="btn-fill rounded-full border border-brass px-8 py-3.5 font-semibold">Sign in</Link>
        </div>
      </div>
    </section>
  );
}
