import banner01 from '@/assets/guild-banners/banner-01.webp';
import banner02 from '@/assets/guild-banners/banner-02.webp';
import banner03 from '@/assets/guild-banners/banner-03.webp';
import banner04 from '@/assets/guild-banners/banner-04.webp';
import banner05 from '@/assets/guild-banners/banner-05.webp';
import banner06 from '@/assets/guild-banners/banner-06.webp';
import banner07 from '@/assets/guild-banners/banner-07.webp';
import banner08 from '@/assets/guild-banners/banner-08.webp';
import banner09 from '@/assets/guild-banners/banner-09.webp';
import banner10 from '@/assets/guild-banners/banner-10.webp';
import banner11 from '@/assets/guild-banners/banner-11.webp';
import banner12 from '@/assets/guild-banners/banner-12.webp';
import banner13 from '@/assets/guild-banners/banner-13.webp';
import banner14 from '@/assets/guild-banners/banner-14.webp';
import banner15 from '@/assets/guild-banners/banner-15.webp';
import banner16 from '@/assets/guild-banners/banner-16.webp';
import banner17 from '@/assets/guild-banners/banner-17.webp';
import banner18 from '@/assets/guild-banners/banner-18.webp';
import banner19 from '@/assets/guild-banners/banner-19.webp';
import banner20 from '@/assets/guild-banners/banner-20.webp';
import banner21 from '@/assets/guild-banners/banner-21.webp';
import banner22 from '@/assets/guild-banners/banner-22.webp';
import banner23 from '@/assets/guild-banners/banner-23.webp';
import banner24 from '@/assets/guild-banners/banner-24.webp';
import banner25 from '@/assets/guild-banners/banner-25.webp';
import banner26 from '@/assets/guild-banners/banner-26.webp';
import banner27 from '@/assets/guild-banners/banner-27.webp';
import banner28 from '@/assets/guild-banners/banner-28.webp';
import banner29 from '@/assets/guild-banners/banner-29.webp';
import banner30 from '@/assets/guild-banners/banner-30.webp';

const sources = [
  banner01, banner02, banner03, banner04, banner05, banner06, banner07, banner08, banner09, banner10,
  banner11, banner12, banner13, banner14, banner15, banner16, banner17, banner18, banner19, banner20,
  banner21, banner22, banner23, banner24, banner25, banner26, banner27, banner28, banner29, banner30,
];

export const GUILD_LOGOS = sources.map((src, index) => ({
  id: `nuvelor${String(index + 1).padStart(2, '0')}`,
  src,
}));

export const DEFAULT_GUILD_LOGO = GUILD_LOGOS[0].src;
export const GUILD_LOGO_BY_ID = Object.fromEntries(GUILD_LOGOS.map(({ id, src }) => [id, src]));
