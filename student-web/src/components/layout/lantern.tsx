'use client';

import { useEffect } from 'react';

/** Soft gold light that follows the mouse and reveals a hidden arabesque pattern. No cursor circle. */
export function Lantern() {
  useEffect(() => {
    const root = document.documentElement.style;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let mx = window.innerWidth / 2, my = window.innerHeight * 0.4, lx = mx, ly = my, raf = 0;
    const move = (e: PointerEvent) => { mx = e.clientX; my = e.clientY; };
    const loop = () => {
      lx += (mx - lx) * 0.1;
      ly += (my - ly) * 0.1;
      root.setProperty('--mx', `${lx}px`);
      root.setProperty('--my', `${ly}px`);
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener('pointermove', move);
    if (!reduce) loop();
    return () => { window.removeEventListener('pointermove', move); cancelAnimationFrame(raf); };
  }, []);

  return (<><div className="lantern" aria-hidden /><div className="glow" aria-hidden /></>);
}
