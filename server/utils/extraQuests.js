import { serverConfig } from '../config.js';
import { verifyTelegramInitData } from './telegramAuth.js';
import { classifyTelegramMembership } from './partnerVerification.js';
const avatarCache = new Map();
export async function getPlayerTelegramAvatar(userId) {
  if (!/^\d+$/.test(String(userId))) throw new Error('Invalid Telegram identity');
  const key = `player:${userId}`;
  const cached = avatarCache.get(key);
  if (cached?.expires > Date.now()) return cached;
  const photos = await telegram('getUserProfilePhotos', { user_id: Number(userId), limit: 1 });
  const photo = photos.photos?.[0]?.find(entry => entry.width >= 160) || photos.photos?.[0]?.[0];
  if (!photo) throw new Error('No Telegram profile photo');
  const file = await telegram('getFile', { file_id: photo.file_id });
  if (!file.file_path || file.file_path.includes('..')) throw new Error('Invalid photo path');
  const response = await fetch(`https://api.telegram.org/file/bot${serverConfig.telegramBotToken}/${file.file_path}`, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error('Photo unavailable');
  const result = { bytes: Buffer.from(await response.arrayBuffer()), contentType: 'image/jpeg', expires: Date.now() + 300000 };
  if (avatarCache.size >= 1000) avatarCache.delete(avatarCache.keys().next().value);
  avatarCache.set(key, result);
  return result;
}
export function extraChannelId(value) {
  const match = String(value || '').match(/^(?:https:\/\/t\.me\/|@)([a-zA-Z0-9_]+)\/?$/);
  if (!match) throw new Error('Invalid channel');
  const id = '@' + match[1];
  const allowed = [process.env.VITE_TG_CHANNEL_URL || 'https://t.me/planet4_game', process.env.VITE_TG_CHANNEL_URL_2 || 'https://t.me/PLANET4_Chat'].map(v => '@' + v.replace(/^https:\/\/t\.me\/|^@/g, '').replace(/\/$/, '').toLowerCase());
  if (!allowed.includes(id.toLowerCase())) throw new Error('Unknown channel');
  return id;
}
async function telegram(method, body) {
  if (!serverConfig.telegramBotToken) throw new Error('Telegram is not configured');
  const response = await fetch(`https://api.telegram.org/bot${serverConfig.telegramBotToken}/${method}`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(10000)});
  const result = await response.json();
  if (!response.ok || !result.ok) {
    const code = Number.isInteger(result?.error_code) ? result.error_code : response.status;
    const description = String(result?.description || '').slice(0, 180).replace(/[\r\n]/g, ' ');
    throw new Error(`Telegram request failed (${code}): ${description}`);
  }
  return result.result;
}
export async function checkPartnerTelegramSubscription(handle, userId) {
  if (!/^[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(handle) || !/^\d+$/.test(String(userId))) throw new Error('Invalid Telegram partner identity');
  const member = await telegram('getChatMember', { chat_id: `@${handle}`, user_id: Number(userId) });
  return classifyTelegramMembership(member);
}
export async function checkExtraSubscription(body, initData) {
  const chat_id = extraChannelId(body.channel);
  const verified = verifyTelegramInitData(initData);
  let userId;
  if (verified.ok) userId = JSON.parse(verified.parsed.user || '{}').id;
  else if (process.env.NODE_ENV !== 'production') userId = body.userId;
  if (!userId || !/^\d+$/.test(String(userId))) throw new Error('Telegram identity required');
  const member = await telegram('getChatMember', {chat_id,user_id:Number(userId)});
  return {subscribed:['creator','administrator','member'].includes(member.status) || (member.status === 'restricted' && member.is_member === true)};
}
export async function getExtraChannelAvatar(channel) {
  const chat_id = extraChannelId(channel);
  const cached = avatarCache.get(chat_id);
  if (cached && cached.expires > Date.now()) return cached.bytes;
  const chat = await telegram('getChat', {chat_id});
  if (!chat.photo?.small_file_id) throw new Error('No channel photo');
  const file = await telegram('getFile', {file_id:chat.photo.small_file_id});
  const response = await fetch(`https://api.telegram.org/file/bot${serverConfig.telegramBotToken}/${file.file_path}`, {signal:AbortSignal.timeout(10000)});
  if (!response.ok) throw new Error('Photo unavailable');
  const bytes = Buffer.from(await response.arrayBuffer());
  avatarCache.set(chat_id,{bytes,expires:Date.now()+3600000});
  return bytes;
}

export function normalizePublicTelegramUsername(value) {
  const raw = String(value || '').trim();
  const match = raw.match(/^(?:https?:\/\/(?:www\.)?t\.me\/|@)?([a-zA-Z0-9_]{5,32})\/?$/i);
  if (!match) throw new Error('Enter a public Telegram username or t.me link');
  return match[1];
}

export async function getPublicTelegramAvatar(username) {
  const normalized = normalizePublicTelegramUsername(username);
  const cacheKey = `partner:${normalized.toLowerCase()}`;
  const cached = avatarCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return cached;
  const chat = await telegram('getChat', { chat_id: `@${normalized}` });
  if (!chat.photo?.small_file_id) throw new Error('This Telegram profile has no public photo');
  const file = await telegram('getFile', { file_id: chat.photo.small_file_id });
  const response = await fetch(`https://api.telegram.org/file/bot${serverConfig.telegramBotToken}/${file.file_path}`, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error('Telegram photo unavailable');
  const contentType = response.headers.get('content-type')?.split(';')[0] || 'image/jpeg';
  const result = { bytes: Buffer.from(await response.arrayBuffer()), contentType };
  avatarCache.set(cacheKey, { ...result, expires: Date.now() + 3600000 });
  return result;
}
