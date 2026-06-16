// Emblema de la Polla Mundial 2026: roundel verde con borde dorado,
// 3 estrellas (motivo de campeonato) y un balón de fútbol estilizado.
export default function Logo({ size = 40 }: { size?: number }) {
  const star = 'M0,-3 L0.71,-0.97 L2.85,-0.93 L1.14,0.37 L1.76,2.43 L0,1.2 L-1.76,2.43 L-1.14,0.37 L-2.85,-0.93 L-0.71,-0.97 Z';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Polla Mundial 2026"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="pollaField" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#27AE60" />
          <stop offset="1" stopColor="#1A6B2F" />
        </linearGradient>
      </defs>

      {/* Anillo dorado + campo verde */}
      <circle cx="32" cy="32" r="31" fill="#D4A017" />
      <circle cx="32" cy="32" r="27.5" fill="url(#pollaField)" />

      {/* Estrellas de campeón */}
      <g fill="#D4A017">
        <path d={star} transform="translate(21.5 16.5)" />
        <path d={star} transform="translate(32 13)" />
        <path d={star} transform="translate(42.5 16.5)" />
      </g>

      {/* Balón */}
      <g>
        <circle cx="32" cy="35" r="13" fill="#ffffff" />
        {/* Pentágono central */}
        <polygon
          points="32,30 36.76,33.45 34.94,39.05 29.06,39.05 27.24,33.45"
          fill="#16271c"
        />
        {/* Costuras hacia el borde */}
        <g stroke="#16271c" strokeWidth="1.4" strokeLinecap="round">
          <line x1="32" y1="30" x2="32" y2="22" />
          <line x1="36.76" y1="33.45" x2="44.36" y2="30.98" />
          <line x1="34.94" y1="39.05" x2="39.64" y2="45.52" />
          <line x1="29.06" y1="39.05" x2="24.36" y2="45.52" />
          <line x1="27.24" y1="33.45" x2="19.64" y2="30.98" />
        </g>
      </g>
    </svg>
  );
}
