import { useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { DEFAULT_BOSS_REWARD_CONFIG } from '@/lib/bossRewardSystem.js';
import { GAME_CONFIG } from '@/lib/gameConfig';

const RESOURCES = [
  ['tentacles', 'Tentacles'],
  ['xp', 'XP'],
  ['strength', 'CA'],
  ['energy', 'Energy'],
  ['premium', 'T-Pape'],
];

const LABELS = {
  uk: {
    scale: 'Загальний масштаб виплат', scaleHint: '0,5 означає половину від розрахованої суми',
    random: 'Випадковий множник', participation: 'Участь у бою', minDamage: 'Мін. шкода', maxDamage: 'Макс. поріг шкоди', hpRatio: 'Частка HP боса',
    participationRewards: 'Бонус за участь', damageRates: 'Ставка за кожні 1 000 шкоди', multiplierTiers: 'Множник за HP боса', hp: 'HP боса', multiplier: 'Множник',
    cashback: 'Повернення отрути', maxHp: 'До HP (порожньо = без межі)', min: 'Мін. шанс', max: 'Макс. шанс',
    keyDrop: 'Ключі босів', baseChance: 'Базовий шанс', pityStep: 'Додаток за pity', maxChance: 'Макс. шанс',
    specialDrop: 'Рідкісний дроп', gear: 'Екіпірування', pet: 'Пет', background: 'Фон', rank1: 'Топ-1', top10: 'Топ-10', top100: 'Топ-100', rankBonus: 'Бонус шансів за ранг',
    bossScenes: 'Сцена за конкретного боса', sceneWeightNote: 'Це вага в таблиці рідкісного дропу; підсумковий шанс також залежить від ваг інших нагород, бонусу рангу та ліміту.',
    rankMultipliers: 'Множник нагород за місце', maxRank: 'До місця', iconThresholds: 'Пороги іконок шкоди', add: 'Додати рядок', remove: 'Видалити', advanced: 'Розширене редагування JSON',
    formula: 'Формула: (бонус участі + шкода / 1 000 × ставка) × множник HP × випадковий множник × множник рангу × загальний масштаб.',
    chanceNote: 'Шанси вводяться часткою: 0,01 = 1%.',
    scaleNote: 'Масштаб застосовується до ресурсів, першого дропу та шансу ключа.',
  },
  en: {
    scale: 'Overall reward scale', scaleHint: '0.5 means half of the calculated amount',
    random: 'Random multiplier', participation: 'Fight participation', minDamage: 'Minimum damage', maxDamage: 'Maximum threshold', hpRatio: 'Boss HP ratio',
    participationRewards: 'Participation bonus', damageRates: 'Rate per 1,000 damage', multiplierTiers: 'Boss HP multiplier', hp: 'Boss HP', multiplier: 'Multiplier',
    cashback: 'Poison refund', maxHp: 'Up to HP (blank = unlimited)', min: 'Min chance', max: 'Max chance',
    keyDrop: 'Boss keys', baseChance: 'Base chance', pityStep: 'Pity increment', maxChance: 'Max chance',
    specialDrop: 'Special drops', gear: 'Gear', pet: 'Pet', background: 'Background', rank1: 'Top 1', top10: 'Top 10', top100: 'Top 100', rankBonus: 'Rank chance bonus',
    bossScenes: 'Scene drop by boss', sceneWeightNote: 'This is the weight in the special-drop table; final odds also depend on other rewards, rank bonus, and the cap.',
    rankMultipliers: 'Reward multiplier by rank', maxRank: 'Through rank', iconThresholds: 'Damage icon thresholds', add: 'Add row', remove: 'Remove', advanced: 'Advanced JSON editor',
    formula: 'Formula: (participation bonus + damage / 1,000 × rate) × HP multiplier × random multiplier × rank multiplier × overall scale.',
    chanceNote: 'Enter chances as fractions: 0.01 = 1%.',
    scaleNote: 'Scale applies to resources, first-kill rewards, and key-drop chance.',
  },
  ru: {
    scale: 'Общий масштаб наград', scaleHint: '0,5 означает половину рассчитанной суммы',
    random: 'Случайный множитель', participation: 'Участие в бою', minDamage: 'Мин. урон', maxDamage: 'Макс. порог урона', hpRatio: 'Доля HP босса',
    participationRewards: 'Бонус за участие', damageRates: 'Ставка за каждые 1 000 урона', multiplierTiers: 'Множитель по HP босса', hp: 'HP босса', multiplier: 'Множитель',
    cashback: 'Возврат яда', maxHp: 'До HP (пусто = без лимита)', min: 'Мин. шанс', max: 'Макс. шанс',
    keyDrop: 'Ключи боссов', baseChance: 'Базовый шанс', pityStep: 'Добавка pity', maxChance: 'Макс. шанс',
    specialDrop: 'Редкий дроп', gear: 'Экипировка', pet: 'Пет', background: 'Фон', rank1: 'Топ-1', top10: 'Топ-10', top100: 'Топ-100', rankBonus: 'Бонус шанса за ранг',
    bossScenes: 'Сцена для каждого босса', sceneWeightNote: 'Это вес в таблице редкого дропа; итоговый шанс также зависит от других наград, бонуса ранга и лимита.',
    rankMultipliers: 'Множитель наград по месту', maxRank: 'До места', iconThresholds: 'Пороги иконок урона', add: 'Добавить строку', remove: 'Удалить', advanced: 'Расширенное редактирование JSON',
    formula: 'Формула: (бонус участия + урон / 1 000 × ставка) × множитель HP × случайный множитель × множитель ранга × общий масштаб.',
    chanceNote: 'Шансы вводятся долей: 0,01 = 1%.',
    scaleNote: 'Масштаб применяется к ресурсам, наградам за первое убийство и шансу ключа.',
  },
};

const fieldClass = 'min-w-0 rounded-xl border border-white/10 bg-[#100f1a] px-3 py-2 text-sm text-white outline-none focus:border-violet-400';
const labelClass = 'grid min-w-0 gap-1 text-[11px] text-slate-400';

export default function BossRewardFormulaEditor({ config, onChange, language = 'uk' }) {
  const labels = LABELS[language] || LABELS.uk;
  const value = useMemo(() => ({ ...DEFAULT_BOSS_REWARD_CONFIG, ...(config || {}) }), [config]);
  const sceneBosses = (GAME_CONFIG.BOSSES || []).filter((boss) => Object.hasOwn(value.backgroundChanceByBoss || {}, boss.id));
  const update = (path, nextValue) => {
    const draft = structuredClone(value);
    let target = draft;
    path.slice(0, -1).forEach((key) => { target = target[key]; });
    target[path.at(-1)] = nextValue;
    onChange(draft);
  };
  const numberInput = (path, current, label, { min = 0, step = 'any', percent = false, nullable = false } = {}) => (
    <label className={labelClass} key={path.join('.')}>{label}{percent ? ' (%)' : ''}
      <input className={fieldClass} type="number" min={min} step={step} value={current === null && nullable ? '' : percent ? Number(current || 0) * 100 : current}
        onChange={(event) => update(path, nullable && event.target.value === '' ? null : Number(event.target.value || 0) / (percent ? 100 : 1))} />
    </label>
  );
  const listEditor = (path, entries, fields, createEntry) => (
    <div className="space-y-2">
      {entries.map((entry, index) => <div key={`${path.join('.')}-${index}`} className="grid grid-cols-[repeat(auto-fit,minmax(110px,1fr))_36px] items-end gap-2 rounded-xl border border-white/5 bg-black/10 p-2">
        {fields.map(([key, label, options = {}]) => numberInput([...path, index, key], entry[key], label, key === 'maxHp' ? { ...options, nullable: true } : options))}
        <button type="button" disabled={entries.length <= 1} className="mb-0.5 grid h-9 w-9 place-items-center rounded-lg border border-red-400/20 text-red-300 hover:bg-red-500/10 disabled:opacity-30" title={labels.remove}
          onClick={() => update(path, entries.filter((_, row) => row !== index))}><Trash2 size={15} /></button>
      </div>)}
      <button type="button" className="inline-flex items-center gap-1 rounded-lg border border-violet-400/20 px-3 py-2 text-xs font-bold text-violet-200 hover:bg-violet-500/10"
        onClick={() => update(path, [...entries, createEntry()])}><Plus size={14} />{labels.add}</button>
    </div>
  );

  return <div className="space-y-4">
    <p className="rounded-xl border border-cyan-400/15 bg-cyan-400/5 p-3 text-xs leading-relaxed text-cyan-100">{labels.formula}<br /><span className="text-cyan-200/70">{labels.scaleNote} {labels.chanceNote}</span></p>
    <section className="rounded-2xl border border-white/10 bg-[#141220] p-3 sm:p-4">
      <h3 className="mb-3 font-bold text-violet-200">{labels.participation}</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {numberInput(['rewardScale'], value.rewardScale, labels.scale, { step: '0.01' })}
        {numberInput(['randomMultiplier', 'min'], value.randomMultiplier.min, `${labels.random} · ${labels.min}`, { step: '0.01' })}
        {numberInput(['randomMultiplier', 'max'], value.randomMultiplier.max, `${labels.random} · ${labels.max}`, { step: '0.01' })}
        {numberInput(['participation', 'minDamage'], value.participation.minDamage, labels.minDamage)}
        {numberInput(['participation', 'maxDamage'], value.participation.maxDamage, labels.maxDamage)}
        {numberInput(['participation', 'hpRatio'], value.participation.hpRatio, labels.hpRatio, { step: '0.0001', percent: true })}
      </div>
      <p className="mb-2 mt-4 text-xs font-bold text-slate-300">{labels.participationRewards}</p>
      <div className="grid gap-2 sm:grid-cols-3">{RESOURCES.map(([key, name]) => numberInput(['participation', 'rewards', key], value.participation.rewards[key], name))}</div>
      <p className="mb-2 mt-4 text-xs font-bold text-slate-300">{labels.damageRates}</p>
      <div className="grid gap-2 sm:grid-cols-3">{RESOURCES.map(([key, name]) => numberInput(['damagePer1000', key], value.damagePer1000[key], name))}</div>
    </section>
    <section className="rounded-2xl border border-white/10 bg-[#141220] p-3 sm:p-4">
      <h3 className="mb-3 font-bold text-violet-200">{labels.multiplierTiers}</h3>
      {listEditor(['multiplierTiers'], value.multiplierTiers, [['hp', labels.hp], ['multiplier', labels.multiplier, { step: '0.01' }],], () => ({ hp: 0, multiplier: 1 }))}
    </section>
    <div className="grid gap-4 xl:grid-cols-2">
      <section className="rounded-2xl border border-white/10 bg-[#141220] p-3 sm:p-4">
        <h3 className="mb-3 font-bold text-violet-200">{labels.cashback}</h3>
        {listEditor(['cashbackTiers'], value.cashbackTiers, [['maxHp', labels.maxHp], ['min', labels.min, { step: '0.01', percent: true }], ['max', labels.max, { step: '0.01', percent: true }]], () => ({ maxHp: null, min: 0, max: 0 }))}
      </section>
      <section className="rounded-2xl border border-white/10 bg-[#141220] p-3 sm:p-4">
        <h3 className="mb-3 font-bold text-violet-200">{labels.keyDrop}</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {numberInput(['keyDrop', 'baseChance'], value.keyDrop.baseChance, labels.baseChance, { step: '0.01', percent: true })}
          {numberInput(['keyDrop', 'pityStep'], value.keyDrop.pityStep, labels.pityStep, { step: '0.01', percent: true })}
          {numberInput(['keyDrop', 'maxChance'], value.keyDrop.maxChance, labels.maxChance, { step: '0.01', percent: true })}
        </div>
      </section>
    </div>
    <div className="grid gap-4 xl:grid-cols-2">
      <section className="rounded-2xl border border-white/10 bg-[#141220] p-3 sm:p-4">
        <h3 className="mb-3 font-bold text-violet-200">{labels.specialDrop}</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {['gear', 'pet', 'background'].map((key) => numberInput(['specialDrop', 'baseChance', key], value.specialDrop.baseChance[key], labels[key], { step: '0.01', percent: true }))}
          {numberInput(['specialDrop', 'maxChance'], value.specialDrop.maxChance, labels.maxChance, { step: '0.01', percent: true })}
        </div>
        <h4 className="mb-1 mt-4 text-xs font-bold text-slate-300">{labels.bossScenes}</h4>
        <p className="mb-2 text-[11px] leading-relaxed text-slate-500">{labels.sceneWeightNote}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {sceneBosses.map((boss) => numberInput(['backgroundChanceByBoss', boss.id], value.backgroundChanceByBoss?.[boss.id] ?? value.specialDrop.baseChance.background, boss.name, { step: '0.01', percent: true }))}
        </div>
        <h4 className="mb-2 mt-4 text-xs font-bold text-slate-300">{labels.rankBonus}</h4>
        <div className="grid gap-2 sm:grid-cols-3">
          {['rank1', 'top10', 'top100'].map((key) => numberInput(['specialDrop', 'rankBonus', key], value.specialDrop.rankBonus[key], labels[key], { step: '0.01', percent: true }))}
        </div>
      </section>
      <section className="rounded-2xl border border-white/10 bg-[#141220] p-3 sm:p-4">
        <h3 className="mb-3 font-bold text-violet-200">{labels.rankMultipliers}</h3>
        {listEditor(['rankMultipliers'], value.rankMultipliers, [['maxRank', labels.maxRank], ['multiplier', labels.multiplier, { step: '0.01' }]], () => ({ maxRank: 1, multiplier: 1 }))}
      </section>
    </div>
    <section className="rounded-2xl border border-white/10 bg-[#141220] p-3 sm:p-4">
      <h3 className="mb-3 font-bold text-violet-200">{labels.iconThresholds}</h3>
      <div className="grid gap-2 sm:grid-cols-4">{value.boxIconShareThresholds.map((threshold, index) => numberInput(['boxIconShareThresholds', index], threshold, `${index + 1}`, { step: '0.001', percent: true }))}</div>
    </section>
  </div>;
}
