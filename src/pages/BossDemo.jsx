import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import boss from '@/assets/boss/avatars/underweight.png';
const copy = {
 en: ['Demo: first boss', 'A local practice fight. Progress and rewards are not saved.', 'Attack', 'Victory!', 'Continue to sign in', 'Fight again', 'Back'],
 ru: ['Демо: первый босс', 'Тренировочный бой. Прогресс и награды не сохраняются.', 'Атаковать', 'Победа!', 'Продолжить: вход в игру', 'Сразиться снова', 'Назад'],
 uk: ['Демо: перший бос', 'Тренувальний бій. Прогрес і нагороди не зберігаються.', 'Атакувати', 'Перемога!', 'Продовжити: вхід у гру', 'Битися знову', 'Назад'],
};
export default function BossDemo() {
 const { i18n } = useTranslation();
 const t = copy[i18n.language === 'ua' ? 'uk' : i18n.language] || copy.en;
 const [hp, setHp] = useState(100);
 const [hit, setHit] = useState(0);
 const lastAttack = useRef(0);
 const attack = () => {
   if (Date.now() - lastAttack.current < 350 || hp <= 0) return;
   lastAttack.current = Date.now();
   setHp(value => Math.max(0, value - 10));
   setHit(value => value + 1);
 };
 return <main className="min-h-[100dvh] bg-[#0d0a07] text-[#edf8d9] flex items-center justify-center p-6 text-center"><section className="w-full max-w-sm space-y-5">
   <h1 className="text-2xl font-bold">{hp ? t[0] : t[3]}</h1><p>{t[1]}</p>
   <img key={hit} src={boss} alt="" className="w-52 h-52 object-contain mx-auto" style={{ opacity: hp ? 1 : .45 }} />
   <progress aria-label="Boss HP" max="100" value={hp} className="w-full" /><p aria-live="polite">HP: {hp} / 100</p>
   {hp > 0 ? <button onClick={attack} className="block w-full rounded-xl bg-[#b9ea45] p-4 font-bold text-black">{t[2]}</button> : <><a href="/web" className="block rounded-xl bg-[#b9ea45] p-4 font-bold text-black">{t[4]}</a><button onClick={() => { setHp(100); setHit(0); }} className="underline">{t[5]}</button></>}
   <a href="/web" className="block underline">{t[6]}</a>
 </section></main>;
}
