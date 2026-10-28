import { useId } from 'react';

type Kind = 'jar' | 'bottle' | 'tin' | 'box';
const PALETTE: Array<[string, string]> = [
  ['#9a2222', '#3d0808'], ['#e0a030', '#7a4a0a'], ['#3b7048', '#12301c'], ['#c4647e', '#5e1f33'],
  ['#7a4c2a', '#2a160a'], ['#6a8c30', '#27370d'], ['#4a2416', '#1a0b06'], ['#ecc95e', '#9a7418'],
];

function hash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
}

function kindFor(name: string): Kind {
  const n = name.toLowerCase();
  if (/(oil|bottle|juice|syrup|vinegar)/.test(n)) return 'bottle';
  if (/(date|box|biscuit|chocolate)/.test(n)) return 'box';
  if (/(tea|chai|coffee|pista|nut|almond|spice|salt)/.test(n)) return 'tin';
  return 'jar';
}

/** Products have no photos yet: draw luxury packaging from the product name (deterministic). */
export function ProductArt({ name }: { name: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [a, b] = PALETTE[hash(name) % PALETTE.length];
  const kind = kindFor(name);
  const word = name.split(' ')[0].slice(0, 10);

  const label = (x: number, y: number, w: number, h: number) => (
    <>
      <rect x={x} y={y} width={w} height={h} rx={3} fill="#f3e9d8" />
      <text x={60} y={y + h * 0.4} textAnchor="middle" fontFamily="serif" fontSize={5.4} fill="#5a3a1a">MIRZA’S NATURAL</text>
      <text x={60} y={y + h * 0.78} textAnchor="middle" fontFamily="serif" fontSize={word.length > 7 ? 9 : 12} fontWeight={600} fill="#2a0f17">{word}</text>
    </>
  );
  const shine = (x: number, y: number, h: number) => <rect x={x} y={y} width={6} height={h} rx={3} fill="#fff" opacity={0.16} />;

  return (
    <svg viewBox="0 0 120 150" role="img" aria-label={name}>
      <defs>
        <linearGradient id={`g${uid}`} x1="0" x2="1"><stop offset="0" stopColor={a} /><stop offset=".55" stopColor={b} /><stop offset="1" stopColor={a} /></linearGradient>
        <linearGradient id={`k${uid}`} x1="0" x2="1"><stop offset="0" stopColor="#8f6d2c" /><stop offset=".5" stopColor="#f1d58b" /><stop offset="1" stopColor="#8f6d2c" /></linearGradient>
      </defs>
      {kind === 'jar' && (<><rect x={30} y={8} width={60} height={20} rx={5} fill={`url(#k${uid})`} /><rect x={18} y={26} width={84} height={116} rx={20} fill={`url(#g${uid})`} />{label(28, 66, 64, 48)}{shine(26, 38, 92)}</>)}
      {kind === 'bottle' && (<><rect x={46} y={2} width={28} height={14} rx={3} fill={`url(#k${uid})`} /><rect x={48} y={14} width={24} height={30} fill={`url(#g${uid})`} /><rect x={28} y={40} width={64} height={104} rx={26} fill={`url(#g${uid})`} />{label(34, 78, 52, 48)}{shine(34, 52, 80)}</>)}
      {kind === 'tin' && (<><rect x={14} y={14} width={92} height={20} rx={6} fill={`url(#k${uid})`} /><rect x={18} y={32} width={84} height={110} rx={8} fill={`url(#g${uid})`} />{label(28, 64, 64, 52)}{shine(24, 40, 94)}</>)}
      {kind === 'box' && (<><rect x={8} y={34} width={104} height={22} rx={5} fill={`url(#k${uid})`} /><rect x={12} y={54} width={96} height={88} rx={6} fill={`url(#g${uid})`} />{label(26, 72, 68, 50)}</>)}
    </svg>
  );
}
