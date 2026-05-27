import { cn } from '@/lib/utils';

type LogoProps = {
  variant?: 'mark' | 'full';
  /** Visual size (height in px). Width auto-scales. */
  size?: number;
  className?: string;
  /** Override the wordmark text. Default "Lumora". */
  wordmark?: string;
  /** Accent color override — defaults to currentColor on the dot. */
  accentClassName?: string;
};

/**
 * Lumora brand mark. Geometric glyph (overlapping circles forming an "L")
 * plus wordmark. Renders in currentColor so it inherits text color, with the
 * accent dot using --primary by default.
 */
export function Logo({
  variant = 'full',
  size = 24,
  className,
  wordmark = 'Lumora',
  accentClassName = 'text-primary',
}: LogoProps) {
  const showMark = true;
  const showWord = variant === 'full';

  return (
    <span
      className={cn('inline-flex items-center gap-2 leading-none', className)}
      role="img"
      aria-label={`${wordmark} logo`}
    >
      {showMark && (
        <svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect
            x="4"
            y="4"
            width="24"
            height="24"
            rx="6"
            fill="currentColor"
            opacity="0.12"
          />
          <path
            d="M10 8v12a4 4 0 0 0 4 4h8"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="22" cy="10" r="3" className={cn('fill-current', accentClassName)} />
        </svg>
      )}
      {showWord && (
        <span
          className="font-bold tracking-tight"
          style={{ fontSize: `${Math.round(size * 0.75)}px` }}
        >
          {wordmark}
        </span>
      )}
    </span>
  );
}
