import { useToast } from "@/components/game/use-toast";
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/game/toast";

function ToastMessage({ message, dismiss }) {
  const { id, title, description, action, duration = 4000, open, onOpenChange, ...props } = message;
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => dismiss(id), Number.isFinite(duration) && duration > 0 ? duration : 4000);
    return () => clearTimeout(timer);
  }, [id, open, duration, dismiss]);
  if (!open) return null;
  return <Toast {...props} className="px-3 py-2 pr-9" role="status" aria-live="polite">
    <div className="min-w-0 grid gap-0.5 break-words">
      {title && <ToastTitle className="text-xs leading-4">{title}</ToastTitle>}
      {description && <ToastDescription className="text-[11px] leading-4">{description}</ToastDescription>}
    </div>
    {action}
    <ToastClose aria-label="Close notification" className="opacity-100" onClick={() => { onOpenChange?.(false); dismiss(id); }} />
  </Toast>;
}

export function Toaster() {
  const { toasts, dismiss } = useToast();
  const [gameShell, setGameShell] = useState(null);
  useEffect(() => {
    let current = null;
    const syncHost = () => {
      const next = document.querySelector('.game-shell');
      if (next !== current) { current = next; setGameShell(next); }
    };
    syncHost();
    const observer = new MutationObserver(syncHost);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  const notifications = (
    <ToastProvider {...(gameShell ? { className: 'pointer-events-none absolute inset-x-0 top-[calc(var(--app-top-offset,0px)+8px)] z-[100] flex max-h-[25%] w-full flex-col gap-1 overflow-hidden px-3', 'data-game-toasts': true } : {})}>
      {toasts.map(message => <ToastMessage key={message.id} message={message} dismiss={dismiss} />)}
      {!gameShell && <ToastViewport />}
    </ToastProvider>
  );
  return gameShell ? createPortal(notifications, gameShell) : notifications;
} 
