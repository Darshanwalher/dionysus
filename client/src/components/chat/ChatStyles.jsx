/* Motion for the chat room. Same rules as the other pages:
   transform + opacity only, short durations, respects reduced-motion. */
export const CHAT_CSS = `
@keyframes chat-rise  { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
@keyframes chat-fade  { from { opacity: 0; } to { opacity: 1; } }
@keyframes chat-pop   { 0% { opacity: 0; transform: scale(.6); } 60% { opacity: 1; transform: scale(1.18); } 100% { opacity: 1; transform: scale(1); } }
@keyframes chat-dot   { 0%, 80%, 100% { transform: translateY(0); opacity: .4; } 40% { transform: translateY(-4px); opacity: 1; } }
@keyframes chat-sweep { 0% { transform: translateX(-100%); } 100% { transform: translateX(260%); } }
@keyframes chat-slide-fwd  { from { opacity: 0; transform: translateX(14px); } to { opacity: 1; transform: none; } }
@keyframes chat-slide-back { from { opacity: 0; transform: translateX(-14px); } to { opacity: 1; transform: none; } }
@keyframes chat-fly   { 0% { transform: none; opacity: 1; } 45% { transform: translate(7px, -7px) scale(.85); opacity: 0; } 55% { transform: translate(-7px, 7px) scale(.85); opacity: 0; } 100% { transform: none; opacity: 1; } }

.chat-rise  { animation: chat-rise .4s cubic-bezier(.22,1,.36,1) both; }
.chat-fade  { animation: chat-fade .35s ease both; }
.chat-pop   { animation: chat-pop .34s cubic-bezier(.22,1,.36,1) both; }
.chat-dot   { animation: chat-dot 1.1s ease-in-out infinite; }
.chat-sweep { width: 40%; animation: chat-sweep 1.3s ease-in-out infinite; }
.chat-fly   { animation: chat-fly .45s ease both; }
.chat-slide-fwd  { animation: chat-slide-fwd .22s cubic-bezier(.22,1,.36,1) both; }
.chat-slide-back { animation: chat-slide-back .22s cubic-bezier(.22,1,.36,1) both; }

.chat-drawer { transition: transform .34s cubic-bezier(.22,1,.36,1); will-change: transform; }
.chat-scrim  { transition: opacity .25s ease; }
.chat-pill   { transition: transform .3s cubic-bezier(.22,1,.36,1); will-change: transform; }

@media (prefers-reduced-motion: reduce) {
  .chat-rise, .chat-fade, .chat-pop, .chat-fly, .chat-slide-fwd, .chat-slide-back { animation: none !important; }
  .chat-dot, .chat-sweep { animation: none !important; }
  .chat-drawer, .chat-scrim, .chat-pill { transition: none !important; }
}
`;

export function ChatStyles() {
  return <style>{CHAT_CSS}</style>;
}