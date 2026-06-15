import Image from "next/image";

/**
 * App logo — the "trailhead" artwork (public/logo.png). Rendered inside a
 * rounded, clipped frame and scaled up a touch to crop the source PNG's soft
 * drop-shadow margin so it sits flush on any background.
 */
export function Logo({ size = 36 }: { size?: number }) {
  return (
    <span
      className="relative inline-block shrink-0 overflow-hidden rounded-[24%] shadow-sm ring-1 ring-black/5 dark:ring-white/10"
      style={{ width: size, height: size }}
    >
      <Image
        src="/logo.png"
        alt="Adventure Advisor"
        fill
        sizes={`${size}px`}
        className="scale-[1.07] object-cover"
        priority
      />
    </span>
  );
}
