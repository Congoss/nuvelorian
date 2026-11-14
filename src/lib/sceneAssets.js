const images = new Map();
const readyImages = new Map();
const maxDecodedBytes = 32 * 1024 * 1024;
const maxDecodedImages = 128;
let decodedBytes = 0;

export function isSceneImageReady(url) {
  const entry = readyImages.get(url);
  if (!entry) return false;
  readyImages.delete(url);
  readyImages.set(url, entry);
  return entry.decoded;
}
export async function warmFirstFrameImages(urls) {
  const pending = [...new Set(urls)].filter(url => url && !url.startsWith('data:'));
  for (let index = 0; index < pending.length; index += 2) {
    await Promise.allSettled(pending.slice(index, index + 2).map(warmSceneImage));
  }
}
export function warmSceneImage(url, { fetchPriority = 'low' } = {}) {
  if (images.has(url)) {
    isSceneImageReady(url);
    return images.get(url);
  }

  const image = new Image();
  image.decoding = 'async';
  image.fetchPriority = fetchPriority;
  const task = new Promise((resolve, reject) => {
    image.onload = async () => {
      let decoded = false;
      try {
        if (image.decode) {
          await image.decode();
          decoded = true;
        }
      } catch {
        // A loaded image can still be displayed by the browser.
      }
      const bytes = (image.naturalWidth || 0) * (image.naturalHeight || 0) * 4;
      if (decoded && bytes <= maxDecodedBytes) {
        readyImages.set(url, { bytes, decoded });
        decodedBytes += bytes;
        while (decodedBytes > maxDecodedBytes || readyImages.size > maxDecodedImages) {
          const [oldest, entry] = readyImages.entries().next().value;
          decodedBytes -= entry.bytes;
          readyImages.delete(oldest);
          images.delete(oldest);
        }
      } else {
        images.delete(url);
      }
      resolve(image);
    };
    image.onerror = () => {
      images.delete(url);
      reject(new Error('Scene image unavailable'));
    };
  });
  images.set(url, task);
  image.src = url;
  return task;
}
export const SHIP_SCENE_ASSETS = {
  portal: ['/ship-gum-queen/battle-poster-v1.webp'],
  hull: ['cheese-workshop-v3','body','parts','eye-blank-v1','workshop-paddle-v1','workshop-wheel-v1','workshop-lamp-v1','alien-mouse-left-v2','alien-mouse-right-v3'].map(name=>'/ship-cheese-boss/'+name+'.webp'),
  engine: ['growth-room-v2','soldier-intact-v3','room-fan-v2','room-helmet-v2','room-mushrooms-v2','room-vine-v2'].map(name=>'/ship-soldier-boss/'+name+'.webp'),
  hangar: ['background','body-underpaint','boss','glove-right-cut','background-rocks'].map(name=>'/ship-kangaroo-boss/'+name+'.webp'),
};
export function warmShipScene(id) {
  return Promise.allSettled((SHIP_SCENE_ASSETS[id]||[]).map(warmSceneImage));
}
