"use client";

export function LogoIcon({ size = 32, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Rounded square background */}
      <rect width="48" height="48" rx="14" fill="url(#logo-bg)" />

      {/* Chat bubble */}
      <path
        d="M14 16C14 14.8954 14.8954 14 16 14H32C33.1046 14 34 14.8954 34 16V28C34 29.1046 33.1046 30 32 30H22L16.5 34.5C15.8333 35 15 34.5523 15 33.7V30H16C14.8954 30 14 29.1046 14 28V16Z"
        fill="white"
        fillOpacity="0.25"
      />

      {/* Lightning bolt (SMS speed) */}
      <path
        d="M26.5 14L20 24H24.5L21.5 34L30 22H25L26.5 14Z"
        fill="white"
        strokeLinejoin="round"
      />

      {/* Signal dots */}
      <circle cx="15.5" cy="22" r="1.5" fill="white" fillOpacity="0.5" />
      <circle cx="12" cy="22" r="1" fill="white" fillOpacity="0.3" />

      <defs>
        <linearGradient id="logo-bg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3B82F6" />
          <stop offset="0.5" stopColor="#4F46E5" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function LogoFull({ size = 32, className = "", light = false }) {
  const textColor = light ? "white" : "#1a1a2e";
  const subColor = light ? "rgba(255,255,255,0.5)" : "#9ca3af";

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoIcon size={size} />
      <div className="flex flex-col">
        <span
          className="font-bold tracking-tight leading-tight"
          style={{ fontSize: size * 0.44, color: textColor, fontFamily: "'Outfit', sans-serif" }}
        >
          Messaging
        </span>
        <span
          className="font-medium leading-tight"
          style={{ fontSize: size * 0.28, color: subColor }}
        >
          by SeloraX
        </span>
      </div>
    </div>
  );
}

export function LogoMark({ size = 24, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="48" height="48" rx="14" fill="url(#logo-mark-bg)" />
      <path
        d="M14 16C14 14.8954 14.8954 14 16 14H32C33.1046 14 34 14.8954 34 16V28C34 29.1046 33.1046 30 32 30H22L16.5 34.5C15.8333 35 15 34.5523 15 33.7V30H16C14.8954 30 14 29.1046 14 28V16Z"
        fill="white"
        fillOpacity="0.25"
      />
      <path
        d="M26.5 14L20 24H24.5L21.5 34L30 22H25L26.5 14Z"
        fill="white"
      />
      <circle cx="15.5" cy="22" r="1.5" fill="white" fillOpacity="0.5" />
      <circle cx="12" cy="22" r="1" fill="white" fillOpacity="0.3" />
      <defs>
        <linearGradient id="logo-mark-bg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3B82F6" />
          <stop offset="0.5" stopColor="#4F46E5" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
    </svg>
  );
}
