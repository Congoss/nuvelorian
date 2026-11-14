export default function BossPortraitHp({ current, max, language }) {
  const total = Math.max(1, Number(max) || 1);
  const hp = Math.max(0, Math.min(total, Number(current ?? total) || 0));
  const format = value => {
    const unit = value >= 1e9 ? 1e9 : value >= 1e6 ? 1e6 : value >= 1e3 ? 1e3 : 1;
    const suffix = language === 'en' ? { 1: '', 1000: 'k', 1000000: 'm', 1000000000: 'b' } : { 1: '', 1000: 'к', 1000000: 'млн', 1000000000: 'млрд' };
    return `${Number((value / unit).toFixed(1))}${suffix[unit]}`;
  };
  return <div className="boss-portrait-hp" role="meter" aria-label="HP" aria-valuemin={0} aria-valuemax={total} aria-valuenow={hp} title={`${hp.toLocaleString()} / ${total.toLocaleString()} HP`}>
    <span className="boss-portrait-hp-fill" style={{ width: `${hp / total * 100}%` }} />
    <span className="boss-portrait-hp-text">{format(hp)} HP</span>
  </div>;
}
