// components/ui/Icons.tsx
// Iconografía centralizada — Lucide style, stroke-based

type IconProps = { size?: number; className?: string };

const svg = (paths: React.ReactNode, size: number, cls?: string) => (
  <svg
    width={size} height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cls}
  >
    {paths}
  </svg>
);

export const Icons = {
  // ── NAVEGACIÓN ─────────────────────────────────
  home: ({ size = 20, className }: IconProps) => svg(
    <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
    size, className
  ),
  explore: ({ size = 20, className }: IconProps) => svg(
    <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    size, className
  ),
  courses: ({ size = 20, className }: IconProps) => svg(
    <><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></>,
    size, className
  ),
  dashboard: ({ size = 20, className }: IconProps) => svg(
    <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></>,
    size, className
  ),
  // ── ADMIN ──────────────────────────────────────
  shield: ({ size = 20, className }: IconProps) => svg(
    <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>,
    size, className
  ),
  users: ({ size = 20, className }: IconProps) => svg(
    <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></>,
    size, className
  ),
  live: ({ size = 20, className }: IconProps) => svg(
    <><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 010 8.49m-8.48-.01a6 6 0 010-8.49m11.31-2.82a10 10 0 010 14.14m-14.14 0a10 10 0 010-14.14"/></>,
    size, className
  ),
  palette: ({ size = 20, className }: IconProps) => svg(
    <><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12a10 10 0 0010 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></>,
    size, className
  ),
  // ── ECOMMERCE ──────────────────────────────────
  store: ({ size = 20, className }: IconProps) => svg(
    <><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></>,
    size, className
  ),
  cart: ({ size = 20, className }: IconProps) => svg(
    <><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 001.98 1.61h9.72a2 2 0 001.98-1.68L23 6H6"/></>,
    size, className
  ),
  // ── AUTH ───────────────────────────────────────
  login: ({ size = 20, className }: IconProps) => svg(
    <><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></>,
    size, className
  ),
  logout: ({ size = 20, className }: IconProps) => svg(
    <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    size, className
  ),
  user: ({ size = 20, className }: IconProps) => svg(
    <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    size, className
  ),
  // ── UI ─────────────────────────────────────────
  chevronLeft: ({ size = 16, className }: IconProps) => svg(
    <polyline points="15 18 9 12 15 6"/>,
    size, className
  ),
  chevronRight: ({ size = 16, className }: IconProps) => svg(
    <polyline points="9 18 15 12 9 6"/>,
    size, className
  ),
  chevronDown: ({ size = 16, className }: IconProps) => svg(
    <polyline points="6 9 12 15 18 9"/>,
    size, className
  ),
  menu: ({ size = 22, className }: IconProps) => svg(
    <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>,
    size, className
  ),
  close: ({ size = 22, className }: IconProps) => svg(
    <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    size, className
  ),
  plus: ({ size = 20, className }: IconProps) => svg(
    <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    size, className
  ),
  services: ({ size = 20, className }: IconProps) => svg(
    <><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M5.34 18.66l-1.41 1.41M2 12h2m16 0h2M5.34 5.34L3.93 3.93M18.66 18.66l1.41 1.41M12 2v2m0 16v2"/></>,
    size, className
  ),
  // ── CURSO / PLAYER ─────────────────────────────
  play: ({ size = 20, className }: IconProps) => svg(
    <><polygon points="5 3 19 12 5 21 5 3"/></>,
    size, className
  ),
  check: ({ size = 20, className }: IconProps) => svg(
    <><polyline points="20 6 9 17 4 12"/></>,
    size, className
  ),
  lock: ({ size = 20, className }: IconProps) => svg(
    <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></>,
    size, className
  ),
  file: ({ size = 20, className }: IconProps) => svg(
    <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></>,
    size, className
  ),
  download: ({ size = 20, className }: IconProps) => svg(
    <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
    size, className
  ),
  messageSquare: ({ size = 20, className }: IconProps) => svg(
    <><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></>,
    size, className
  ),
  star: ({ size = 20, className }: IconProps) => svg(
    <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></>,
    size, className
  ),
  award: ({ size = 20, className }: IconProps) => svg(
    <><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></>,
    size, className
  ),
  // ── ZOOM / VIDEO ───────────────────────────────
  video: ({ size = 20, className }: IconProps) => svg(
    <><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></>,
    size, className
  ),
  // ── LANDING CMS ────────────────────────────────
  layout: ({ size = 20, className }: IconProps) => svg(
    <><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></>,
    size, className
  ),
};

export type IconName = keyof typeof Icons;
