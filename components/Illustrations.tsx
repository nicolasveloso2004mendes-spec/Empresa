/** Representações ilustrativas (vetoriais) — não são fotografias de produtos ou da fábrica. */

const EDGE = "#8e663b";

export function ConventionalBoxArt() {
  return (
    <svg viewBox="0 0 240 200" className="art" aria-hidden="true">
      <ellipse cx="120" cy="184" rx="88" ry="9" fill="#39352b" opacity=".14" />
      <path d="M120 30 210 70 120 110 30 70Z" fill="#c69963" stroke={EDGE} strokeWidth="2" strokeLinejoin="round" />
      <path d="M30 70 120 110v66L30 136Z" fill="#b98751" stroke={EDGE} strokeWidth="2" strokeLinejoin="round" />
      <path d="M120 110 210 70v66l-90 40Z" fill="#a77540" stroke={EDGE} strokeWidth="2" strokeLinejoin="round" />
      {/* linha de encontro das abas + fita */}
      <path d="M75 50 165 90" stroke="#7a5630" strokeWidth="1.5" />
      <path d="M70 52.5 160 92.5 170 88 80 48Z" fill="#d9b98c" opacity=".75" />
      <path d="M160 92.5v28l10-4.5V88Z" fill="#cfae80" opacity=".75" />
    </svg>
  );
}

export function DieCutBoxArt() {
  return (
    <svg viewBox="0 0 240 200" className="art" aria-hidden="true">
      <ellipse cx="120" cy="184" rx="92" ry="9" fill="#39352b" opacity=".14" />
      {/* tampa aberta articulada na borda traseira */}
      <path d="M120 86 206 120 206 46 120 12Z" fill="#c29660" stroke={EDGE} strokeWidth="2" strokeLinejoin="round" />
      <path d="M120 12 206 46 196 36 128 8Z" fill="#b98751" stroke={EDGE} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M152 30a8 4 22 0 0 18 7" fill="none" stroke={EDGE} strokeWidth="1.5" />
      {/* interior */}
      <path d="M34 120 120 86 206 120 120 154Z" fill="#8f6436" stroke={EDGE} strokeWidth="2" strokeLinejoin="round" />
      <path d="M44 120 120 90 196 120 120 150Z" fill="#a07444" opacity=".55" />
      {/* paredes */}
      <path d="M34 120 120 154v28L34 148Z" fill="#c69963" stroke={EDGE} strokeWidth="2" strokeLinejoin="round" />
      <path d="M120 154 206 120v28l-86 34Z" fill="#a77540" stroke={EDGE} strokeWidth="2" strokeLinejoin="round" />
      {/* vincos */}
      <path d="M40 123l80 32" stroke="#7a5630" strokeWidth="1" strokeDasharray="4 4" />
    </svg>
  );
}

export function CustomBoxArt() {
  return (
    <svg viewBox="0 0 240 200" className="art" aria-hidden="true">
      <ellipse cx="116" cy="184" rx="86" ry="9" fill="#39352b" opacity=".14" />
      <path d="M100 48 186 84 116 116 30 80Z" fill="#c69963" stroke={EDGE} strokeWidth="2" strokeLinejoin="round" />
      <path d="M30 80 116 116v60L30 140Z" fill="#b98751" stroke={EDGE} strokeWidth="2" strokeLinejoin="round" />
      <path d="M116 116 186 84v60l-70 32Z" fill="#a77540" stroke={EDGE} strokeWidth="2" strokeLinejoin="round" />
      <g stroke="#183c30" strokeWidth="1.5" fill="none" strokeLinecap="round">
        <path d="M22 88v52" strokeDasharray="3 4" />
        <path d="M18 88h8M18 140h8" />
        <path d="M124 188l70-32" strokeDasharray="3 4" />
        <path d="M120 182l8 10M190 150l8 10" />
        <path d="M24 152l86 36" strokeDasharray="3 4" />
      </g>
    </svg>
  );
}

export function FluteArt({ layers }: { layers: 1 | 2 }) {
  const wave = (y: number) => {
    let d = `M0 ${y}`;
    for (let x = 0; x < 240; x += 16) d += ` q4 -9 8 0 t8 0`;
    return d;
  };
  const h = layers === 1 ? 44 : 70;
  return (
    <svg viewBox={`0 0 240 ${h}`} className="flute" aria-hidden="true" preserveAspectRatio="none">
      <rect x="0" y="2" width="240" height="4" fill="#9a6f3f" />
      <path d={wave(layers === 1 ? 22 : 20)} stroke="#b98751" strokeWidth="2.4" fill="none" />
      {layers === 2 && (
        <>
          <rect x="0" y="33" width="240" height="4" fill="#9a6f3f" />
          <path d={wave(51)} stroke="#b98751" strokeWidth="2.4" fill="none" />
        </>
      )}
      <rect x="0" y={h - 6} width="240" height="4" fill="#9a6f3f" />
    </svg>
  );
}
