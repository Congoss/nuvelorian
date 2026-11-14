function animateWhenVisible(canvas, enabled, draw, fps) {
  if (!canvas || !enabled) return () => {};
  let frame = 0;
  let disposed = false;
  let last = 0;
  let visible = typeof IntersectionObserver === 'undefined';
  const interval = 1000 / fps;
  let canAnimate = () => !disposed && visible && !document.hidden;
  const tick = (time) => {
    frame = 0;
    if (!canAnimate()) return;
    if (time - last >= interval) {
      last = time;
      draw(time);
    }
    frame = requestAnimationFrame(tick);
  };
  const sync = () => {
    if (canAnimate()) {
      if (!frame) frame = requestAnimationFrame(tick);
    } else if (frame) {
      cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
    }
  };
  const intersection = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  });
  intersection?.observe(canvas);
  document.addEventListener('visibilitychange', sync);
  // Android WebView can drop canvas backing stores under GPU memory pressure.
  // Hide the effect instead of letting a lost surface paint as a white block.
  let lost = false;
  const onLost = event => { event.preventDefault?.(); lost = true; canvas.style.visibility = 'hidden'; if (frame) cancelAnimationFrame(frame); frame = 0; };
  const onRestored = () => { lost = false; canvas.style.visibility = ''; sync(); };
  canvas.addEventListener('contextlost', onLost);
  canvas.addEventListener('contextrestored', onRestored);
  const baseCanAnimate = canAnimate;
  canAnimate = () => !lost && baseCanAnimate();
  sync();
  return () => {
    disposed = true;
    cancelAnimationFrame(frame);
    frame = 0;
    intersection?.disconnect();
    document.removeEventListener('visibilitychange', sync);
    canvas.removeEventListener('contextlost', onLost);
    canvas.removeEventListener('contextrestored', onRestored);
  };
}

export function startLegendaryFire(canvas, enabled=true) {
if(!canvas)return()=>{};
const context=canvas.getContext('2d');const width=canvas.width,height=canvas.height;
const firePixels = context.createImageData(width, height);
const smooth = value => value * value * (3 - 2 * value);
function hash(x, y) {
  const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return value - Math.floor(value);
}
function noise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const sx = smooth(x - ix), sy = smooth(y - iy);
  const a = hash(ix, iy), b = hash(ix + 1, iy);
  const c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
  return (a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy;
}
function turbulence(x, y) {
  return noise(x, y) * .6 + noise(x * 2, y * 2) * .27 + noise(x * 4, y * 4) * .13;
}
// Cache a hollow, slightly wider halo. Only its visible band needs noise.
const samples = [];
const contour = [[0,14],[.10,27],[.23,40],[.43,54],[.66,55],[.82,47],[1,31]];
  for (let y = 0; y < height; y++) {
    const position = y / height;
    let spread = 31;
    for (let index = 1; index < contour.length; index++) {
      if (position > contour[index][0]) continue;
      const [from, a] = contour[index - 1], [to, b] = contour[index];
      spread = a + (b - a) * smooth((position - from) / (to - from));
      break;
    }
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;
      const sampleX = x * 125 / width;
      const sampleY = y * 224 / height;
      const nx = (sampleX - 63) / (spread * 1.12);
      const distance = Math.abs(nx);
      if (distance <= .27 || distance >= 1.05) continue;
      const edge = Math.max(0, 1 - nx * nx);
      const innerFade = smooth(Math.min(1, (distance - .27) / .22));
      const topFade = Math.min(1, sampleY / 23);
      const bottomFade = Math.min(1, (224 - sampleY) / 7);
      samples.push({ offset, x: sampleX, y: sampleY, edge, fade: innerFade * topFade * bottomFade });
    }
  }
function drawAura(time) {
  const seconds = time / 1000;
  for (const { offset, x, y, edge, fade } of samples) {
      const warp = noise(x * .025, y * .025 + seconds * .45) - .5;
      // Positive time in the sampling coordinate carries the texture upwards.
      const texture = turbulence(x * .09 + warp * 1.5, y * .035 + seconds * .65);
      const heat = edge * .83 + (texture - .5) * .95;
      const strength = Math.max(0, Math.min(1, (heat - .25) * 2.1));
      const alpha = smooth(strength) * fade;
      firePixels.data[offset] = Math.min(190, 12 + strength * strength * 178);
      firePixels.data[offset + 1] = Math.min(255, 135 + strength * 120);
      firePixels.data[offset + 2] = Math.min(255, 225 + strength * 30);
      firePixels.data[offset + 3] = alpha * 210;
  }
  context.putImageData(firePixels, 0, 0);
}

if(!enabled){drawAura(1500);return()=>{};}
return animateWhenVisible(canvas, true, drawAura, 15);
}


export function startLegendaryHandsFire(canvas,enabled=true) {
 if(!canvas || !enabled)return()=>{};
 const handContext=canvas.getContext('2d');
 const sparks = [];

function drawHands(time) {
  handContext.clearRect(0, 0, 250, 448);
  for (const x of [84, 166]) {
    if (Math.random() < .7) sparks.push({ x: x + (Math.random() - .5) * 10,
      y: 248 + Math.random() * 10, age: 0, life: 18 + Math.random() * 15,
      radius: 2 + Math.random() * 2, phase: Math.random() * 6.28 });
  }
  for (let i = sparks.length - 1; i >= 0; i--) {
    const spark = sparks[i];
    spark.age++;
    if (spark.age >= spark.life) { sparks.splice(i, 1); continue; }
    spark.y -= .65;
    const x = spark.x + Math.sin(time / 180 + spark.phase) * 1.4;
    const radius = spark.radius * (1 - spark.age / spark.life) + .5;
    const gradient = handContext.createRadialGradient(x, spark.y, 0, x, spark.y, radius * 2);
    gradient.addColorStop(0, 'rgba(255,231,136,.65)');
    gradient.addColorStop(.4, 'rgba(255,139,21,.45)');
    gradient.addColorStop(1, 'rgba(255,61,0,0)');
    handContext.fillStyle = gradient;
    handContext.fillRect(x - radius * 2, spark.y - radius * 2, radius * 4, radius * 4);
  }
}

 return animateWhenVisible(canvas, enabled, drawHands, 24);
}
