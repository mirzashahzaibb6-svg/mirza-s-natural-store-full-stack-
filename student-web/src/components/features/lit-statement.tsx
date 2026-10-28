'use client';

import { useEffect, useRef } from 'react';

/** Words light up one by one as the paragraph scrolls through the viewport. */
export function LitStatement({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const words = [...el.querySelectorAll<HTMLElement>('span')];
    const update = () => {
      const r = el.getBoundingClientRect();
      const p = Math.min(Math.max((window.innerHeight * 0.85 - r.top) / (r.height + window.innerHeight * 0.3), 0), 1);
      words.forEach((w, i) => { w.style.opacity = i / words.length < p * 1.15 ? '1' : '0.16'; });
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  return (
    <p ref={ref} className="font-display mx-auto max-w-[18em] px-6 py-[22vh] text-center text-[clamp(30px,5vw,76px)] leading-[1.05]">
      {text.split(' ').map((w, i) => <span key={i} className="transition-opacity duration-300" style={{ opacity: 0.16 }}>{w} </span>)}
    </p>
  );
}
