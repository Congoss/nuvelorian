import heroIcon from '@/assets/optimized/nav-hero.webp';

export default function AvatarWithFrame({
  src,
  alt = '',
  className = '',
  imageClassName = '',
  roundedClassName = 'rounded-[8px]',
}) {
  return (
    <div className={`relative overflow-hidden ${roundedClassName} ${className}`}>
      <img
        src={src || heroIcon}
        alt={alt}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = heroIcon; }}
        className={`absolute inset-0 h-full w-full object-cover ${imageClassName}`}
      />
    </div>
  );
}
