import { useEffect, useState } from 'react';
import { isSceneImageReady, warmSceneImage } from '@/lib/sceneAssets';

export default function FirstFrameImage({ preview, src, ...props }) {
  const [decoded, setDecoded] = useState(null);
  useEffect(() => {
    if (!src || src.startsWith('data:') || (props.loading === 'lazy' && !preview)) return;
    let current = true;
    warmSceneImage(src).then(() => { if (current) setDecoded(src); }, () => {});
    return () => { current = false; };
  }, [preview, src, props.loading]);
  return <img {...props} src={decoded === src || isSceneImageReady(src) ? src : preview || src} />;
}
