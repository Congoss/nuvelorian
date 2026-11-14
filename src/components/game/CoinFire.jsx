import { useEffect, useRef } from 'react';

// Advect flame texture inside the original coin mask; never change its silhouette.
export default function CoinFire() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current, ctx = canvas?.getContext('2d');
    if (!ctx) return undefined;
    const width = 53, height = 71, pixels = ctx.createImageData(width, height);
    const field = Float32Array.from({ length: 4096 }, (_, i) => {
      let n = Math.imul(i + 71, 1597334677); n ^= n >>> 13;
      return (n >>> 0) / 4294967295;
    });
    const smooth = x => x * x * (3 - 2 * x);
    const noise = (x, y) => {
      const ix = Math.floor(x), iy = Math.floor(y), sx = smooth(x - ix), sy = smooth(y - iy);
      const at = (a, b) => field[((b & 63) << 6) | (a & 63)];
      return (at(ix, iy) * (1 - sx) + at(ix + 1, iy) * sx) * (1 - sy)
        + (at(ix, iy + 1) * (1 - sx) + at(ix + 1, iy + 1) * sx) * sy;
    };
    let frame, last = 0, disposed = false;
    const draw = time => {
      if (disposed) return;
      if (time - last >= 1000 / 18) {
        last = time;
        const t = time / 1000;
        pixels.data.fill(0);
        for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
          const warp = (noise(x * .085, y * .075 + t * 1.4) - .5) * 7;
          const turbulence = noise(x * .16 + warp * .12, y * .13 + t * 2.6) * .7
            + noise(x * .32, y * .26 + t * 4.1) * .3;
          const heat = Math.max(0, (turbulence - .25) * 1.4);
          const intensity = Math.min(1, heat), fade = smooth(Math.min(1, heat * 1.8));
          const offset = (y * width + x) * 4;
          pixels.data[offset] = 255;
          pixels.data[offset + 1] = Math.min(220, 80 + intensity * 145);
          pixels.data[offset + 2] = 4 + intensity * intensity * 30;
          pixels.data[offset + 3] = Math.round(fade * 150);
        }
        ctx.putImageData(pixels, 0, 0);
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => { disposed = true; cancelAnimationFrame(frame); };
  }, []);
  return <canvas xmlns="http://www.w3.org/1999/xhtml" ref={ref} width="53" height="71" style={{ width: '100%', height: '100%', pointerEvents: 'none' }} aria-hidden="true" />;
}
