export function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="adv-grad" x1="0" y1="0" x2="40" y2="40">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      {/* Rounded badge */}
      <rect x="0" y="0" width="40" height="40" rx="11" fill="url(#adv-grad)" />
      {/* Sun / spark */}
      <circle cx="28.5" cy="12.5" r="3.6" fill="#fbbf24" />
      {/* Mountain range (white silhouette) */}
      <path
        d="M6 30 L16 16 L22 24 L26.5 18 L34 30 Z"
        fill="#ffffff"
        fillOpacity="0.96"
      />
      {/* Snowcap notch on the main peak */}
      <path d="M16 16 L13 20 L19 20 Z" fill="#e0f2fe" />
    </svg>
  );
}
