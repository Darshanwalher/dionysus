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
/* Endless loops as CSS transform animations: they run on the compositor thread, so they stay
   smooth even when the CPU is throttled (battery), and cost no JavaScript per frame. */
@keyframes dn-marquee { to { transform: translate3d(-50%, 0, 0); } }
.dn-marquee { animation: dn-marquee 26s linear infinite; will-change: transform; }
@keyframes dn-wave { 0%, 100% { transform: scaleY(.2); } 25% { transform: scaleY(1); } 50% { transform: scaleY(.35); } 75% { transform: scaleY(.8); } }
.dn-wave { animation: dn-wave var(--d, 1.8s) ease-in-out infinite; animation-delay: var(--dl, 0s); transform-origin: bottom; }
@media (prefers-reduced-motion: reduce) { .dn-marquee { animation: none; } .dn-wave { animation: none; transform: scaleY(.5); } }
/* On a struggling device big soft shadows are one of the costliest things to paint */
html[data-perf="low"] .dn .shadow-2xl, html[data-perf="low"] .dn .shadow-lg { box-shadow: 0 6px 16px -8px rgba(16,33,31,.3) !important; }
html[data-perf="mid"] .dn .shadow-2xl, html[data-battery="true"] .dn .shadow-2xl { box-shadow: 0 12px 28px -12px rgba(16,33,31,.22) !important; }
html[data-perf="mid"] .dn .transform-gpu, html[data-battery="true"] .dn .transform-gpu {
  transform: translate3d(0, 0, 0);
  backface-visibility: hidden;
  will-change: transform, opacity;
}
`;