import heroIcon from '@/assets/optimized/nav-hero.webp';
import {createAvatarFailures} from '@/lib/failedAvatars';
const failedAvatars=createAvatarFailures();

export default function AvatarWithFrame({
  src,
  frameId = '',
  alt = '',
  className = '',
  imageClassName = '',
  roundedClassName = 'rounded-[8px]',
}) {
  return (
    <div className={`relative overflow-hidden ${roundedClassName} ${className}`}>
      <img
        src={src && !failedAvatars.has(src) ? src : heroIcon}
        alt={alt}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={(event) => {
          const image=event.currentTarget;
          if(image.src===new URL(heroIcon,document.baseURI).href)return;
          failedAvatars.remember(src);image.src=heroIcon;
        }}
        className={`absolute inset-0 h-full w-full object-cover ${imageClassName}`}
      />
    </div>
  );
}
