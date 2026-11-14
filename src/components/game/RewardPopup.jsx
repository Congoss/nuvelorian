
import { createPortal } from 'react-dom';
import { useEffect } from 'react';
import { X } from 'lucide-react';
import MarkerFrame from './MarkerFrame';
import GameTextureButton from './GameTextureButton';

export default function RewardPopup({ open, title, items = [], onClose, tutorialClaimTarget = false, language = 'uk', confirmLabel, onConfirm }) {
  useEffect(() => {
    if (open && tutorialClaimTarget && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('tutorial-reward-opened'));
    }
  }, [open, tutorialClaimTarget]);
  const content = (
    <>
      {open ? (
        <div
          className="fixed inset-0 z-[220] flex items-center justify-center bg-black/80 px-4 py-5"
        >
        <div
          className="w-full max-w-[min(390px,calc(100vw-16px))]"
        >
          <MarkerFrame
            className="w-full bg-[rgba(6,9,6,0.96)]"
            innerClassName="relative flex flex-col items-center px-2 pb-3 pt-3 sm:px-3"
            variant="transparent"
            data-tutorial-claim-reward={tutorialClaimTarget ? 'true' : undefined}
            data-tutorial-reward-popup={tutorialClaimTarget ? 'true' : undefined}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-[10px] bg-transparent text-[#d8ff84] transition hover:text-[#f1ffc9]"
              aria-label="Close reward popup"
            >
              <X className="h-5 w-5 stroke-[2.6]" />
            </button>

            <div className="text-center">
              <p className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-[#d7ff91]">{title || 'reward'}</p>
            </div>

            <div className="mt-2 flex w-full flex-wrap justify-center gap-1.5">
              {items.map((item) => (
                <div
                  key={`${item.id}-${item.text}`}
                  className={`flex flex-col items-center justify-center gap-1 px-1 py-1 ${item.largeIcon ? 'min-h-[120px] w-[112px]' : 'h-[96px] w-[82px]'}`}
                >
                  <img src={item.icon} alt="" aria-hidden="true" className={`${item.largeIcon ? 'h-[104px] w-[104px]' : 'h-[54px] w-[54px]'} object-contain`} />
                  {item.label ? <p className="w-full text-center font-mono text-[8px] leading-tight font-black uppercase tracking-[0.06em] text-[#9dff43]">{item.label}</p> : null}
                  {item.text ? <p className="text-center font-sans text-[13px] font-black leading-none text-[#fff5d9]">{item.text}</p> : null}
                </div>
              ))}
            </div>

            <GameTextureButton
              type="button"
              onClick={onConfirm || onClose}
              data-tutorial-ack={tutorialClaimTarget ? 'true' : undefined}
              tone="yellow"
              className="mx-auto mt-3 h-[56px] w-fit min-w-[220px]"
            >
              <span className="relative z-[1] font-sans text-[13px] font-black uppercase tracking-[0.12em] text-[#1c210c]">
                {confirmLabel || (language === 'ru' ? 'Ммм, вкусно' : language === 'en' ? 'Mmm, tasty' : 'Ммм, смачно')}
              </span>
            </GameTextureButton>
            </MarkerFrame>
          </div>
        </div>
      ) : null}
    </>
  );

  if (typeof document === 'undefined') return content;

  return createPortal(content, document.body);
}
