const PATHS = {
  // Neo-brutalist file input icon (box with upward arrow inside)
  fileInput: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="1" strokeWidth="2" />
      <path d="M12 7.5v9" strokeWidth="2" />
      <path d="m8 11.5 4-4 4 4" strokeWidth="2" />
    </>
  ),
  // Detection / analytics icon (box with 3 vertical bars inside)
  chartBox: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="1" strokeWidth="2" />
      <path d="M7.5 16v-4.5" strokeWidth="2" />
      <path d="M12 16v-8" strokeWidth="2" />
      <path d="M16.5 16v-6" strokeWidth="2" />
    </>
  ),
  cloud: (
    <>
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 0 1 0 9Z" strokeWidth="2" />
      <path d="M12 12.5v5" strokeWidth="2" />
      <path d="m9.5 14.5 2.5-2 2.5 2" strokeWidth="2" />
    </>
  ),
  doc: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" strokeWidth="2" />
      <path d="M14 2v6h6" strokeWidth="2" />
    </>
  ),
  pages: (
    <>
      <rect x="8" y="8" width="14" height="14" strokeWidth="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" strokeWidth="2" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" strokeWidth="2" />
      <circle cx="8.5" cy="9.5" r="1.5" strokeWidth="2" />
      <path d="m4 19 5.5-5.5 3 3L16 13l4 4" strokeWidth="2" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" strokeWidth="2" />
      <path d="M12 7v5l3 3" strokeWidth="2" />
    </>
  ),
  chart: (
    <>
      <path d="M5 19v-7M10 19V5M15 19v-6M20 19V9" strokeWidth="2" />
      <path d="M3 19h18" strokeWidth="2" />
    </>
  ),
  hourglass: (
    <>
      <line x1="5" y1="4" x2="19" y2="4" strokeWidth="2.2" />
      <line x1="5" y1="20" x2="19" y2="20" strokeWidth="2.2" />
      <path
        d="M7 4c0 4.5 4 6.5 5 8-1 1.5-5 3.5-5 8M17 4c0 4.5-4 6.5-5 8 1 1.5 5 3.5 5 8"
        strokeWidth="2.2"
      />
    </>
  ),
  spinner: (
    <>
      <circle cx="12" cy="12" r="9" opacity="0.15" strokeWidth="2" />
      <path d="M21 12a9 9 0 0 0-9-9" strokeWidth="2" />
    </>
  ),
  download: (
    <>
      <path d="M12 4v11" strokeWidth="2" />
      <path d="m8 10 4 4 4-4" strokeWidth="2" />
      <path d="M4 20h16" strokeWidth="2" />
    </>
  ),
  rotate: (
    <>
      <path d="M3 12a9 9 0 1 1 9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" strokeWidth="2" />
      <path d="M3 22v-6h6" strokeWidth="2" />
    </>
  ),
  check: (
    <>
      <path d="M20 6 9 17l-5-5" strokeWidth="2.5" />
    </>
  ),
  x: (
    <>
      <path d="M18 6 6 18" strokeWidth="2" />
      <path d="M6 6l12 12" strokeWidth="2" />
    </>
  ),
};

export function Icon({ name, size = 16, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name] || PATHS.doc}
    </svg>
  );
}