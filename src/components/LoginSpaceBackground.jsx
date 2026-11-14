import duck from '@/assets/optimized/all/boss/boss_1/boss1_bck/boss4/kosmo/duck.webp';
import burger from '@/assets/optimized/all/boss/boss_1/boss1_bck/boss4/kosmo/burger.webp';
import pizza from '@/assets/optimized/all/boss/boss_1/boss1_bck/boss4/kosmo/pizza.webp';
import gamepad from '@/assets/optimized/all/boss/boss_1/boss1_bck/boss4/kosmo/gamepad.webp';
import cow from '@/assets/optimized/all/boss/boss_1/boss1_bck/boss4/kosmo/cow kosmo.webp';
import cat from '@/assets/optimized/all/boss/boss_1/boss1_bck/boss4/kosmo/cat.webp';
import toilet from '@/assets/optimized/all/boss/boss_1/boss1_bck/boss4/kosmo/toilet.webp';
import paper from '@/assets/optimized/all/boss/boss_1/boss1_bck/boss4/kosmo/tual bumaga.webp';

const debris = [
  { src: duck, box: '296 680 95 112', left: 3, top: 29, size: 59, duration: 34 },
  { src: burger, box: '65 1113 127 97', left: 88, top: 75, size: 65, duration: 43 },
  { src: pizza, box: '421 643 46 71', left: 14, top: 8, size: 36, duration: 37 },
  { src: gamepad, box: '691 88 77 76', left: 91, top: 22, size: 49, duration: 49 },
  { src: cow, box: '71 51 200 183', left: 2, top: 69, size: 86, duration: 46 },
  { src: cat, box: '694 1108 155 159', left: 84, top: 47, size: 67, duration: 39 },
  { src: toilet, box: '488 602 98 103', left: 38, top: 88, size: 57, duration: 53 },
  { src: paper, box: '358 1038 174 121', left: 57, top: 9, size: 62, duration: 41 },
];

const stars = Array.from({ length: 36 }, (_, i) => ({ left: (i * 47 + 7) % 100, top: (i * 31 + 5) % 100, size: i % 6 === 0 ? 3 : 2, duration: 3 + (i % 7) * .7, delay: -(i * 1.3) }));

export default function LoginSpaceBackground() {
  return <div className="web-login__space-fx" aria-hidden="true">
    {stars.map((star, i) => <i key={'star-' + i} className="web-login__space-star" style={{ left: star.left + '%', top: star.top + '%', width: star.size, height: star.size, animationDuration: star.duration + 's', animationDelay: star.delay + 's' }} />)}
    {debris.map((item, i) => <span key={item.src} className="web-login__space-junk" style={{ left: item.left + '%', top: item.top + '%', width: item.size, height: item.size, '--junk-duration': item.duration + 's', '--junk-delay': -(i * 6.3) + 's', '--junk-tilt': (i % 2 ? -16 : 13) + 'deg' }}>
      <svg viewBox={item.box} width="100%" height="100%" focusable="false"><image href={item.src} width="854" height="1280" /></svg>
    </span>)}
    {[0, 1, 2].map(i => <i key={'comet-' + i} className="web-login__space-comet" style={{ left: (85 + i * 9) + '%', top: (6 + i * 23) + '%', animationDuration: (21 + i * 8) + 's', animationDelay: (-i * 13 - 5) + 's' }} />)}
  </div>;
}
