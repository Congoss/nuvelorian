import './profileHeaderFrame.css';
import planetBackground from '@/assets/ui/underweight-profile-planet-v1.png';
import BossProfileFrame from './BossProfileFrame';

export default function ProfileHeaderSkinPreview({bossId='heli'}){
  if(bossId==='ship-hull')bossId='cheese';
  if(bossId!=='heli')return <BossProfileFrame bossId={bossId}/>;
  return <div aria-hidden="true" className="profile-gold-frame">
    <img className="profile-planet-background" src={planetBackground} alt=""/>
    <svg className="profile-cartoon-outline" viewBox="0 0 1000 100" preserveAspectRatio="none">
      <path d="M3 5 171 3 178 6 381 4 387 2 643 5 651 3 844 5 849 2 996 5 998 37 995 43 997 95 803 97 796 94 572 97 565 94 321 97 315 94 4 96 2 61 5 55Z" fill="none" stroke="#c9973d" strokeWidth="5" vectorEffect="non-scaling-stroke"/>
      <path d="M9 11 176 10 182 12 386 10 648 12 851 9 990 11 989 90 802 89 575 91 320 90 10 90Z" fill="none" stroke="#171b10" strokeWidth="2" vectorEffect="non-scaling-stroke"/>
      <path d="m12 6 149-1m31 2 182-1m29 0 227 1m37-1 165 1m34-1 117 1M12 94l286-1m39 1 216-1m37 1 188-1m40 0 163 1" stroke="#efd185" strokeWidth="1.4" vectorEffect="non-scaling-stroke"/>
      <path d="m165 3 8 3-6 4m217-6-4 3 9 3m455-5 5 3-4 3M320 92l-7 3 6 2m481-6-6 3 8 3" fill="none" stroke="#68471e" strokeWidth="1.3" vectorEffect="non-scaling-stroke"/>
      <path d="M651 3c11 1 16-2 25-1l24 2c10 1 14-2 23-1l26 1c10 1 17-1 24 0l23 1c-5 3-12 3-19 2-7-1-10 0-12 3-2 2 1 9-5 9s-3-9-9-10c-7-2-14 0-20 1-5 1-3 5-8 5s-3-6-9-7c-8-2-16 1-24 0-7-2-9 0-12 3-3 2-6 2-8-1-2-4-10-4-19-4Z" fill="#91aa48" stroke="#1a2113" strokeWidth="1.5" vectorEffect="non-scaling-stroke"/>
      <path d="m660 4 18-1 23 2m19-1 27 1m11 7v3m-38-5-1 2" fill="none" stroke="#c1d576" strokeWidth="1" strokeLinecap="round" vectorEffect="non-scaling-stroke"/>
    </svg>
    <span className="profile-cartoon-tape tape-top"/><span className="profile-cartoon-tape tape-bottom"/>
    <span className="profile-cartoon-staple staple-left"/><span className="profile-cartoon-staple staple-right"/>
  </div>;
}
