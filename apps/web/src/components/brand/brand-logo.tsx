type BrandLogoProps = {
  size?: number;
  className?: string;
};

export function BrandLogo({ size = 32, className = "" }: BrandLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="64" height="64" rx="16" fill="url(#saldo-vivo-bg)" />
      <path
        d="M18 38.5C22.6 47.2 35.7 48.6 43.1 41.3C50.7 33.9 48.4 20.9 39.1 16.8"
        stroke="white"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M18 25.5C22.6 16.8 35.7 15.4 43.1 22.7"
        stroke="#B8FFF2"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path d="M24 33H40" stroke="white" strokeWidth="5" strokeLinecap="round" />
      <path d="M32 25V41" stroke="white" strokeWidth="5" strokeLinecap="round" />
      <defs>
        <linearGradient id="saldo-vivo-bg" x1="10" y1="8" x2="56" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#14B8A6" />
          <stop offset="0.55" stopColor="#4F46E5" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
    </svg>
  );
}
