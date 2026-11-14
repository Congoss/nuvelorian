import { useId } from 'react';

const DARK_MARKER_GRADIENT = 'linear-gradient(160deg, #151b0f 0%, #071006 54%, #030503 100%)';

export function MarkerBorder({
  className = '',
  startColor = '#2dff9f',
  endColor = '#1fd177',
  innerColor = '#05110b',
  innerOpacity = 0.72,
}) {
  const gradientId = useId();
  const resolvedStartColor = startColor || '#2dff9f';
  const resolvedEndColor = endColor || '#1fd177';
  const resolvedInnerColor = innerColor || '#05110b';
  const resolvedInnerOpacity = Number.isFinite(Number(innerOpacity)) ? innerOpacity : 0.72;

  return (
    <svg className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={resolvedStartColor} />
          <stop offset="100%" stopColor={resolvedEndColor} />
        </linearGradient>
      </defs>
      <rect x="0.5" y="0.5" width="99" height="99" fill="none" stroke={`url(#${gradientId})`} strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
      <rect x="1.5" y="1.5" width="97" height="97" fill="none" stroke={resolvedInnerColor} strokeWidth="0.8" opacity={resolvedInnerOpacity} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export default function MarkerFrame({
  children,
  className = '',
  innerClassName = '',
  variant = 'dark',
  showBorder = true,
  borderStartColor,
  borderEndColor,
  borderInnerColor,
  borderInnerOpacity,
  ...props
}) {
  const background = variant === 'transparent' ? undefined : DARK_MARKER_GRADIENT;
  const shadow = variant === 'transparent' ? 'none' : '0 0 18px rgba(143, 220, 55, 0.16), inset 0 0 24px rgba(169, 222, 61, 0.08)';

  return (
    <div
      className={`relative overflow-hidden rounded-none ${className}`}
      {...props}
      style={{
        boxShadow: shadow,
        ...(background ? { background } : {}),
      }}
      >
      {showBorder ? (
        <MarkerBorder
          startColor={borderStartColor}
          endColor={borderEndColor}
          innerColor={borderInnerColor}
          innerOpacity={borderInnerOpacity}
        />
      ) : null}
      <div className={`relative z-10 ${innerClassName}`}>{children}</div>
    </div>
  );
}
