export interface FilmGrainProps {
  opacity?: number;
  scale?: number;
}

export function FilmGrain({ opacity = 0.04, scale = 2.5 }: FilmGrainProps) {
  return (
    <svg
      aria-hidden
      className="pm-grain"
      style={{ opacity }}
      width="100%"
      height="100%"
      preserveAspectRatio="none"
    >
      <filter id="pm-grain-filter">
        <feTurbulence type="fractalNoise" baseFrequency={scale * 0.3} numOctaves="2" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#pm-grain-filter)" />
    </svg>
  );
}
