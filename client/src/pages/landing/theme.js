/**
 * Shared tokens, constants and global CSS for the landing page.
 * Place at: client/src/pages/landing/theme.js
 */
export const IV = "#F3EEE8";
export const IV2 = "#FAF7F2";
export const TEAL = "#17645F";
export const CORAL = "#FF6845";
export const CORAL_D = "#C2401F";
export const INK = "#10211F";
export const ease = [0.22, 1, 0.36, 1];

export const GITHUB_URL = "https://github.com/nakulsali/devin"; // or your organization repo URL

export const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,800&family=IBM+Plex+Mono:ital,wght@0,400;0,500;1,400&display=swap');
.dn, .dn-d { font-family: 'Bricolage Grotesque', system-ui, sans-serif; }
.dn-d { letter-spacing: -.035em; }
.dn-m { font-family: 'IBM Plex Mono', ui-monospace, monospace; }
.dn *:focus-visible { outline: 2px solid ${CORAL}; outline-offset: 3px; }
.dn ::selection { background: ${CORAL}; color: ${INK}; }
.glass-dark { background: rgba(16,33,31,.72); border: 1px solid rgba(243,238,232,.12); }
html.lenis, html.lenis body { height: auto; }
.lenis.lenis-smooth { scroll-behavior: auto !important; }
.lenis.lenis-stopped { overflow: hidden; }
.dn .lnk { --lnk: #FF6845; display: inline-block; opacity: .8; background-image: linear-gradient(currentColor, currentColor); background-repeat: no-repeat; background-position: 0 100%; background-size: 0% 1px; transition: background-size .35s ease, color .3s ease, opacity .3s ease, transform .3s ease; }
.dn .lnk:hover { color: var(--lnk); opacity: 1; background-size: 100% 1px; transform: translateX(4px); }
@media (prefers-reduced-motion: reduce) { .dn .lnk:hover { transform: none; } }
`;