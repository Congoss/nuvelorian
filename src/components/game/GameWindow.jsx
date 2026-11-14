import { createPortal } from 'react-dom';

// The host belongs to Game's content area: below TopBar and above BottomNav.
// Windows use that area instead of positioning against the device viewport.
export default function GameWindow({ children, className = '', scroll = true, blurBackground = false }) {
  const host = typeof document !== 'undefined' ? document.getElementById('game-window-root') : null;
  const content = (
    <div data-game-window="true" className="pointer-events-auto absolute inset-0 flex min-h-0 min-w-0 overflow-hidden">
      <div className={`h-full min-h-0 w-full min-w-0 ${scroll ? 'overflow-y-auto overscroll-contain touch-pan-y' : 'overflow-hidden'} ${className}`}>
        {children}
      </div>
    </div>
  );
  return host ? <>
    {blurBackground && host.parentElement ? createPortal(
      <div data-game-window-backdrop="true" className="pointer-events-none absolute inset-0 z-20 bg-black/40 backdrop-blur-[8px]" />,
      host.parentElement,
    ) : null}
    {createPortal(content, host)}
  </> : content;
}
