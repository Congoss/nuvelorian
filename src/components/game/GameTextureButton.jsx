const TONES = {
  purple: { frame:'#1b1023',edge:'#8260a4',background:'radial-gradient(ellipse at 10% 22%,#e1c5fa55 0 5%,transparent 6%),radial-gradient(ellipse at 90% 78%,#d9b5f544 0 5%,transparent 6%),linear-gradient(180deg,#b690d5,#9470b8 55%,#654280 86%,#462951)' },
  'dark-purple': { frame:'#1b1023',edge:'#795393',background:'linear-gradient(180deg,#85609f,#65417f 55%,#482958 86%,#301c3d)' },
  green: {
    frame: '#111608',
    edge: '#5c7718',
    background: 'radial-gradient(ellipse at 9% 23%,rgba(235,250,114,.48) 0 5%,transparent 6%),radial-gradient(ellipse at 14% 38%,rgba(222,244,91,.36) 0 4%,transparent 5%),radial-gradient(ellipse at 91% 75%,rgba(229,247,99,.42) 0 5%,transparent 6%),radial-gradient(ellipse at 85% 88%,rgba(210,237,73,.28) 0 4%,transparent 5%),linear-gradient(180deg,#a9d239 0%,#9ac72e 55%,#82aa20 86%,#58730f 100%)',
  },
  'dark-green': {
    frame: '#0d1507',
    edge: '#4b701d',
    background: 'linear-gradient(180deg,#789d2f 0%,#608421 55%,#486418 86%,#33480f 100%)',
  },
  pink: {
    frame: '#241018',
    edge: '#ae5d7a',
    background: 'radial-gradient(ellipse at 9% 23%,rgba(255,225,237,.48) 0 5%,transparent 6%),radial-gradient(ellipse at 91% 75%,rgba(255,196,218,.42) 0 5%,transparent 6%),linear-gradient(180deg,#f8bbd0 0%,#ee95b5 55%,#d6789b 86%,#99536e 100%)',
  },
  'dark-pink': {
    frame: '#211018',
    edge: '#97536c',
    background: 'linear-gradient(180deg,#c58aa0 0%,#a96983 55%,#80485f 86%,#593044 100%)',
  },
  orange: {
    frame: '#211207',
    edge: '#ae5e1d',
    background: 'radial-gradient(ellipse at 9% 23%,rgba(255,220,145,.48) 0 5%,transparent 6%),radial-gradient(ellipse at 91% 75%,rgba(255,189,94,.42) 0 5%,transparent 6%),linear-gradient(180deg,#ffb84c 0%,#f3962b 55%,#d77818 86%,#99500f 100%)',
  },
  'dark-orange': {
    frame: '#1b1007',
    edge: '#99521c',
    background: 'linear-gradient(180deg,#c77f32 0%,#a56323 55%,#80471a 86%,#593011 100%)',
  },
  yellow: {
    frame: '#1d1906',
    edge: '#99791b',
    background: 'radial-gradient(ellipse at 10% 22%,rgba(255,247,165,.5) 0 5%,transparent 6%),radial-gradient(ellipse at 90% 78%,rgba(255,234,119,.4) 0 5%,transparent 6%),linear-gradient(180deg,#f0ca4c 0%,#d6a72f 58%,#ad7518 100%)',
  },
  blue: {
    frame: '#07131a',
    edge: '#1b667f',
    background: 'radial-gradient(ellipse at 10% 22%,rgba(143,234,255,.42) 0 5%,transparent 6%),radial-gradient(ellipse at 90% 78%,rgba(112,215,246,.35) 0 5%,transparent 6%),linear-gradient(180deg,#50b9d5 0%,#2589a7 58%,#135169 100%)',
  },
  red: {
    frame: '#1c0807',
    edge: '#9d3028',
    background: 'radial-gradient(ellipse at 10% 22%,rgba(255,168,123,.4) 0 5%,transparent 6%),radial-gradient(ellipse at 90% 78%,rgba(255,130,104,.32) 0 5%,transparent 6%),linear-gradient(180deg,#d75a45 0%,#a83228 58%,#651d1a 100%)',
  },
  gray: {
    frame: '#161714',
    edge: '#6d7569',
    background: 'linear-gradient(180deg,#899184 0%,#5e665b 58%,#373d34 100%)',
  },
};

export default function GameTextureButton({ tone = 'green', className = '', children, ...props }) {
  const palette = TONES[tone] || TONES.green;
  return (
    <button
      {...props}
      className={`relative overflow-hidden rounded-[10px_8px_11px_7px] border border-[#090b04] bg-[#141b06] p-px shadow-[0_2px_3px_rgba(0,0,0,0.62)] transition enabled:hover:brightness-110 enabled:active:translate-y-px disabled:cursor-not-allowed ${className}`}
      style={{ backgroundColor: palette.frame, ...props.style }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-px z-0 rounded-[8px_6px_9px_5px] border shadow-[inset_0_1px_0_rgba(244,255,155,0.42),inset_0_-2px_0_rgba(43,62,6,0.3)]"
        style={{ borderColor: palette.edge, backgroundImage: palette.background }}
      />
      {children}
    </button>
  );
}
