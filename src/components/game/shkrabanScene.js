import { LOCAL_TV_CHANNELS, LOCAL_TV_CAPTIONS, nextTvChannel } from '@/lib/localTvChannels';
const imageCache = new Map();
function loadImage(src) {
  if (!imageCache.has(src)) {
    const image = new Image();
    image.src = src;
    imageCache.set(src, image);
  }
  return imageCache.get(src);
}
export function createShkrabanScene(canvas, backgroundOnly) {
  const x = canvas.getContext('2d');
  if (!x) return null;
  const original = backgroundOnly ? null : loadImage('/shkraban/source-boss.webp');
  const background = backgroundOnly ? loadImage('/shkraban/boss-rooftop-city-v2.webp') : null;
  const roofSign = backgroundOnly ? loadImage('/shkraban/rooftop-sign.webp') : null;
  const channels = LOCAL_TV_CHANNELS.map(ch => ({
    ...ch,
    image: loadImage(ch.src)
  }));
  const images = [...channels.map(ch => ch.image), ...(backgroundOnly ? [background, roofSign] : [original])];
  let channel = 0;
  let t = 0;
  let hitAt = -10;
  const roofFx = {
    ready: false,
    sign: null,
    hologram: null,
    lamp: null,
    windows: []
  };
  const roofHash = n => {
    const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return v - Math.floor(v);
  };
  function colorMask(image, box, select, color) {
    const [left, top, width, height] = box,
      canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', {
      willReadFrequently: true
    });
    ctx.drawImage(image, left, top, width, height, 0, 0, width, height);
    const pixels = ctx.getImageData(0, 0, width, height),
      p = pixels.data;
    for (let i = 0; i < p.length; i += 4) {
      const amount = select(p[i], p[i + 1], p[i + 2]);
      p[i + 3] = Math.round(p[i + 3] * Math.max(0, Math.min(1, amount)));
      if (color) {
        p[i] = color[0];
        p[i + 1] = color[1];
        p[i + 2] = color[2];
      }
    }
    ctx.putImageData(pixels, 0, 0);
    return canvas;
  }
  function prepareRoofFx() {
    if (!roofFx.sign && roofSign.complete && roofSign.naturalWidth) roofFx.sign = colorMask(roofSign, [0, 0, roofSign.naturalWidth, roofSign.naturalHeight], (r, g, b) => g > r * 1.2 && g > b * 1.2 ? (g - 65) / 100 : 0, [10, 22, 13]);
    if (roofFx.ready || !background.complete || !background.naturalWidth) return;
    roofFx.ready = true;
    roofFx.hologram = colorMask(background, [775, 75, 215, 280], (r, g, b) => g > r * 1.25 && b > r * 1.25 ? (Math.min(g, b) - 75) / 100 : 0, [105, 246, 255]);
    roofFx.lamp = colorMask(background, [739, 724, 38, 51], (r, g, b) => r > g * 1.5 && r > b * 1.3 ? (r - 70) / 100 : 0, [25, 13, 30]);
    const canvas = document.createElement('canvas');
    canvas.width = 1086;
    canvas.height = 1448;
    const ctx = canvas.getContext('2d', {
      willReadFrequently: true
    });
    ctx.drawImage(background, 0, 0);
    const data = ctx.getImageData(0, 0, 1086, 1448).data,
      seen = new Uint8Array(1086 * 800),
      candidates = [];
    const bright = (px, py) => {
      if (px < 190 || px >= 1010 || py < 55 || py >= 800 || px > 760 && py < 350) return false;
      const i = (py * 1086 + px) * 4,
        r = data[i],
        g = data[i + 1],
        b = data[i + 2];
      return g > 100 && g > r * 1.2 && b > r * 1.1 || r > 115 && b > 100 && r > g * 1.35 && b > g * 1.2 || g > 115 && g > r * 1.3 && g > b * 1.2;
    };
    for (let py = 55; py < 800; py++) for (let px = 190; px < 1010; px++) {
      const index = py * 1086 + px;
      if (seen[index] || !bright(px, py)) continue;
      const queue = [[px, py]];
      seen[index] = 1;
      let l = px,
        r = px,
        u = py,
        d = py;
      for (let j = 0; j < queue.length; j++) {
        const [a, b] = queue[j];
        l = Math.min(l, a);
        r = Math.max(r, a);
        u = Math.min(u, b);
        d = Math.max(d, b);
        for (const [nx, ny] of [[a - 1, b], [a + 1, b], [a, b - 1], [a, b + 1]]) {
          const n = ny * 1086 + nx;
          if (nx < 190 || nx >= 1010 || ny < 55 || ny >= 800 || seen[n] || !bright(nx, ny)) continue;
          seen[n] = 1;
          queue.push([nx, ny]);
        }
      }
      if (queue.length < 6 || r - l > 29 || d - u > 27 || r === l || d === u) continue;
      const box = [l, u, r - l + 1, d - u + 1],
        select = (a, b, c) => Math.max(a, b, c) > 95 ? 1 : 0;
      candidates.push({
        box,
        seed: l * 3 + u * 7,
        on: colorMask(background, box, select, null),
        off: colorMask(background, box, select, [24, 30, 58])
      });
    }
    roofFx.windows = candidates.sort((a, b) => roofHash(a.seed) - roofHash(b.seed)).slice(0, 80);
  }
  const roofScreens = [{
    seed: 1,
    quad: [[39, 662], [128, 673], [121, 750], [35, 743]],
    shape: 'M48 664C69 662 101 666 120 674Q127 676 126 695L124 726Q123 742 118 746Q80 752 42 743Q35 742 36 728L38 685Q39 669 48 664Z'
  }, {
    seed: 3,
    quad: [[102, 792], [161, 794], [158, 847], [102, 846]],
    shape: 'M111 794Q133 790 156 795Q161 798 160 808L159 834Q158 843 153 845Q131 849 108 846Q103 845 102 836L102 809Q102 798 111 794Z'
  }, {
    seed: 5,
    quad: [[138, 55], [193, 63], [188, 105], [135, 99]],
    shape: 'M143 56Q165 55 187 64Q194 68 192 86L190 97Q188 104 184 104L142 100Q135 99 135 91L135 72Q135 58 143 56Z'
  }];
  function roofPoint(quad, u, v) {
    return [quad[0][0] * (1 - u) * (1 - v) + quad[1][0] * u * (1 - v) + quad[2][0] * u * v + quad[3][0] * (1 - u) * v, quad[0][1] * (1 - u) * (1 - v) + quad[1][1] * u * (1 - v) + quad[2][1] * u * v + quad[3][1] * (1 - u) * v];
  }
  function roofTriangle(image, source, dest) {
    const [s0, s1, s2] = source,
      [p0, p1, p2] = dest,
      ux = s1[0] - s0[0],
      uy = s1[1] - s0[1],
      vx = s2[0] - s0[0],
      vy = s2[1] - s0[1],
      det = ux * vy - vx * uy;
    const ax = ((p1[0] - p0[0]) * vy - (p2[0] - p0[0]) * uy) / det,
      cx = ((p2[0] - p0[0]) * ux - (p1[0] - p0[0]) * vx) / det,
      bx = ((p1[1] - p0[1]) * vy - (p2[1] - p0[1]) * uy) / det,
      dx = ((p2[1] - p0[1]) * ux - (p1[1] - p0[1]) * vx) / det;
    x.save();
    x.beginPath();
    x.moveTo(...p0);
    x.lineTo(...p1);
    x.lineTo(...p2);
    x.closePath();
    x.clip();
    x.transform(ax, bx, cx, dx, p0[0] - ax * s0[0] - cx * s0[1], p0[1] - bx * s0[0] - dx * s0[1]);
    x.drawImage(image, 0, 0);
    x.restore();
  }
  function rooftopTV(time, screen) {
    const {
      quad,
      seed
    } = screen;
    const period = 6 + seed * .7,
      slot = Math.floor(time / period),
      ch = channels[(slot + seed) % channels.length];
    if (!ch.image.complete || !ch.image.naturalWidth) return;
    x.save();
    screen.path ??= new Path2D(screen.shape);
    x.clip(screen.path);
    x.globalAlpha = 1;
    const w = ch.image.naturalWidth,
      h = ch.image.naturalHeight;
    for (let row = 0; row < 3; row++) for (let col = 0; col < 4; col++) {
      const u = col / 4,
        v = row / 3,
        uv = [[u, v], [u + .25, v], [u + .25, v + 1 / 3], [u, v + 1 / 3]],
        src = uv.map(([a, b]) => [a * w, b * h]),
        dst = uv.map(([a, b]) => roofPoint(quad, a, b));
      roofTriangle(ch.image, [src[0], src[1], src[2]], [dst[0], dst[1], dst[2]]);
      roofTriangle(ch.image, [src[0], src[2], src[3]], [dst[0], dst[2], dst[3]]);
    }
    const left = Math.min(...quad.map(p => p[0])),
      top = Math.min(...quad.map(p => p[1])),
      width = Math.max(...quad.map(p => p[0])) - left,
      height = Math.max(...quad.map(p => p[1])) - top;
    x.globalAlpha = .16;
    x.fillStyle = '#b1ffff';
    x.fillRect(left, top + (time * .28 + seed * .17) % 1 * height, width, 1.2);
    if (time % period < .13) {
      x.globalAlpha = .45;
      x.fillStyle = '#dcffe9';
      x.fillRect(left, top, width, height);
    }
    x.restore();
  }
  function rooftopSpark(time, px, py, seed) {
    const period = 3.9 + seed * .71,
      phase = (time + seed * .8) % period;
    if (phase > .2) return;
    const flash = Math.sin(phase / .2 * Math.PI),
      variant = Math.floor(time / period) + seed;
    x.save();
    x.globalCompositeOperation = 'screen';
    x.globalAlpha = flash * .85;
    x.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const a = -1.25 + i * .68 + roofHash(variant + i) * .2,
        length = 13 + roofHash(variant * 3 + i) * 14;
      const points = [[px, py], [px + Math.cos(a) * length * .4 + 3, py + Math.sin(a) * length * .4], [px + Math.cos(a) * length * .7 - 2, py + Math.sin(a) * length * .7], [px + Math.cos(a) * length, py + Math.sin(a) * length]];
      for (const [width, color] of [[4, '#ff972733'], [1.5, '#ffd344'], [.5, '#fff4b0']]) {
        x.lineWidth = width;
        x.strokeStyle = color;
        x.beginPath();
        points.forEach((p, j) => j ? x.lineTo(...p) : x.moveTo(...p));
        x.stroke();
      }
    }
    x.restore();
  }
  function drawRooftop(time) {
    if (background.complete && background.naturalWidth) x.drawImage(background, 0, 0, 1024, 1536);
    prepareRoofFx();
    x.save();
    x.scale(1024 / 1086, 1536 / 1448);
    for (const screen of roofScreens) rooftopTV(time, screen);
    for (const light of roofFx.windows) {
      const interval = 1.8 + roofHash(light.seed) * 5,
        step = Math.floor(time / interval),
        value = roofHash(light.seed + step * 17),
        level = value > .48 ? 1 : .12;
      x.save();
      x.globalAlpha = (1 - level) * .85;
      x.drawImage(light.off, ...light.box);
      x.globalCompositeOperation = 'screen';
      x.globalAlpha = level * .3;
      x.drawImage(light.on, ...light.box);
      x.restore();
    }
    if (roofFx.hologram) {
      x.save();
      x.globalCompositeOperation = 'screen';
      x.globalAlpha = .18 + (1 + Math.sin(time * 1.7)) * .17;
      x.drawImage(roofFx.hologram, 775, 75);
      x.beginPath();
      x.rect(775, 75 + time * 37 % 280, 215, 4);
      x.clip();
      x.globalAlpha = .8;
      x.drawImage(roofFx.hologram, 775, 75);
      x.restore();
    }
    const lamp = .5 + .5 * Math.sin(time * 4.6);
    if (roofFx.lamp) {
      x.save();
      x.globalAlpha = (1 - lamp) * .9;
      x.drawImage(roofFx.lamp, 739, 724);
      x.restore();
    }
    x.save();
    x.globalCompositeOperation = 'screen';
    const glow = x.createRadialGradient(758, 747, 1, 758, 747, 25);
    glow.addColorStop(0, `rgba(255,65,51,${lamp * .75})`);
    glow.addColorStop(1, 'rgba(255,35,40,0)');
    x.fillStyle = glow;
    x.fillRect(733, 722, 50, 50);
    x.restore();
    for (const [px, py, angle] of [[170, 444, -.9], [274, 521, -.8]]) for (let i = 0; i < 3; i++) {
      const q = (time * .36 + i / 3) % 1;
      x.save();
      x.strokeStyle = `rgba(115,227,222,${(1 - q) * .21})`;
      x.lineWidth = 1.4;
      x.beginPath();
      x.arc(px, py, 12 + q * 49, angle - .45, angle + .45);
      x.stroke();
      x.restore();
    }
    rooftopSpark(time, 99, 1211, 1);
    rooftopSpark(time, 111, 1209, 3);
    rooftopSpark(time, 282, 806, 5);
    x.restore();
    if (roofSign.complete && roofSign.naturalWidth) {
      x.save();
      x.translate(940, 423);
      x.rotate(Math.sin(time * .7) * .012);
      x.globalAlpha = .72;
      x.drawImage(roofSign, -130, -78, 210, 105);
      if (roofFx.sign) {
        const phase = time % 11.3,
          dim = phase < .08 || phase > .16 && phase < .21;
        x.globalAlpha = dim ? .98 : .08;
        x.drawImage(roofFx.sign, -130, -78, 210, 105);
      }
      x.restore();
    }
  }
  const regions = {
    leftLeg: [[430, 755], [509, 789], [478, 964], [428, 1121], [399, 1268], [424, 1388], [420, 1489], [162, 1512], [158, 1411], [242, 1335], [290, 1216], [316, 1114], [325, 1026], [363, 898]],
    rightLeg: [[522, 762], [615, 760], [691, 880], [732, 1044], [740, 1160], [775, 1288], [889, 1360], [962, 1417], [962, 1496], [645, 1505], [637, 1405], [682, 1330], [681, 1238], [638, 1111], [600, 1005], [553, 902]],
    torso: [[304, 207], [351, 179], [429, 163], [645, 174], [782, 191], [784, 491], [740, 505], [746, 610], [697, 704], [659, 767], [613, 823], [542, 811], [510, 839], [447, 822], [375, 803], [327, 727], [281, 646], [268, 543], [283, 474], [264, 383], [264, 279]],
    leftArm: [[289, 476], [330, 482], [350, 530], [306, 610], [270, 681], [244, 774], [214, 853], [251, 894], [282, 927], [295, 1003], [289, 1072], [272, 1078], [249, 1001], [225, 969], [213, 1035], [237, 1085], [260, 1119], [254, 1144], [222, 1138], [181, 1095], [195, 1140], [223, 1175], [204, 1189], [157, 1165], [114, 1098], [126, 1151], [165, 1199], [143, 1210], [92, 1175], [48, 1112], [30, 1054], [42, 1003], [62, 961], [101, 908], [136, 854], [158, 795], [173, 704], [204, 610], [238, 527]],
    rightArm: [[721, 523], [761, 548], [803, 634], [835, 725], [859, 790], [871, 856], [908, 922], [966, 953], [993, 996], [1008, 1077], [994, 1121], [965, 1175], [914, 1218], [878, 1212], [884, 1196], [940, 1139], [957, 1091], [933, 1134], [892, 1167], [864, 1158], [875, 1143], [916, 1096], [928, 1035], [902, 1005], [874, 1035], [854, 1119], [837, 1111], [827, 1069], [830, 1004], [841, 968], [825, 927], [802, 875], [779, 803], [759, 729], [736, 670], [706, 602]],
    dish: [[341, 174], [342, 78], [355, 35], [387, 24], [445, 29], [486, 67], [505, 107], [491, 158], [445, 178]],
    ant1: [[516, 170], [527, 132], [540, 130], [551, 64], [573, 69], [587, 23], [585, 6], [607, 5], [611, 23], [595, 79], [564, 74], [549, 140], [575, 174]],
    ant2: [[619, 179], [635, 152], [652, 152], [684, 113], [788, 70], [790, 60], [811, 60], [816, 80], [800, 88], [694, 124], [670, 161], [677, 185]]
  };
  function path(p) {
    x.beginPath();
    p.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b));
    x.closePath();
  }
  function piece(name, px, py, angle = 0, dy = 0) {
    x.save();
    x.translate(px, py + dy);
    x.rotate(angle);
    x.translate(-px, -py);
    path(regions[name]);
    x.clip();
    x.drawImage(original, 0, 0);
    x.restore();
  }
  function screenPath() {
    x.beginPath();
    x.moveTo(482, 215);
    x.bezierCurveTo(548, 207, 677, 220, 720, 236);
    x.quadraticCurveTo(738, 243, 736, 276);
    x.lineTo(735, 414);
    x.quadraticCurveTo(734, 447, 710, 447);
    x.lineTo(481, 434);
    x.quadraticCurveTo(456, 432, 457, 408);
    x.lineTo(458, 247);
    x.quadraticCurveTo(458, 218, 482, 215);
    x.closePath();
  }
  // Map the broadcast plane to the CRT glass: both horizontal edges slope down
  // toward the right, with the slight leftward lean of the original screen.
  const screenPlane = [282, 16, -3, 218, 457, 213];
  function broadcastCaption(ch) {
    const caption = LOCAL_TV_CAPTIONS[ch.id];
    if (!caption) return;
    x.save();
    x.fillStyle = caption.background;
    x.fillRect(0, caption.top, 1, 1 - caption.top);
    x.font = `900 ${caption.size}px "Arial Black",Arial,sans-serif`;
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.lineWidth = .006;
    x.strokeStyle = '#000';
    x.fillStyle = caption.color;
    caption.lines.forEach((line, index) => {
      const y = caption.lines.length === 1 ? (caption.top + 1) / 2 : .765 + index * .155;
      x.strokeText(line, .5, y, .88);
      x.fillText(line, .5, y, .88);
    });
    x.restore();
  }
  function television(time, impact) {
    x.save();
    screenPath();
    x.clip();
    x.transform(...screenPlane);
    const ch = channels[channel],
      broadcast = ch.image;
    if (broadcast.complete && broadcast.naturalWidth) x.drawImage(broadcast, 0, 0, 1, 1);
    broadcastCaption(ch);
    if (impact) {
      for (let j = 0; j < 85; j++) {
        x.fillStyle = `rgba(230,245,242,${Math.random() * .8})`;
        x.fillRect(0, Math.random(), 1, (Math.random() * 5 + 1) / 222);
      }
      x.fillStyle = 'rgba(3,7,8,.3)';
      x.fillRect(0, 0, 1, 1);
    }
    x.fillStyle = 'rgba(0,0,0,.08)';
    for (let j = 0; j < 222; j += 4) x.fillRect(0, j / 222, 1, 1 / 222);
    x.restore();
    // Each small display moves inside its own bezel.
    x.save();
    x.translate(433, 613);
    x.rotate(-.16);
    x.beginPath();
    x.roundRect(-29, -32, 57, 65, 4);
    x.clip();
    for (let i = 0; i < 160; i++) {
      let g = 130 + Math.random() * 125;
      x.fillStyle = `rgb(${g},${g},${g})`;
      x.fillRect(-30 + Math.random() * 59, -33 + Math.random() * 66, 3 + Math.random() * 5, 2);
    }
    x.restore();
    x.save();
    x.beginPath();
    x.roundRect(514, 541, 90, 81, 10);
    x.clip();
    x.fillStyle = 'rgba(255,255,255,.5)';
    x.fillRect(514, 542 + time * 22 % 78, 90, 3);
    x.restore();
    x.save();
    x.translate(547, 703);
    x.rotate(.045);
    x.beginPath();
    x.roundRect(-37, -36, 74, 72, 7);
    x.clip();
    x.fillStyle = '#705475';
    x.fillRect(-40, -40, 80, 80);
    x.rotate(time * 1.8);
    x.strokeStyle = '#f3c9df';
    x.lineWidth = 7;
    x.lineCap = 'round';
    x.beginPath();
    for (let a = 0; a < Math.PI * 11; a += .06) {
      let r = 1 + a * 1.65;
      let xx = Math.cos(a) * r,
        yy = Math.sin(a) * r;
      a === 0 ? x.moveTo(xx, yy) : x.lineTo(xx, yy);
    }
    x.stroke();
    x.restore();
    x.save();
    x.translate(645, 728);
    x.rotate(.28);
    const smileGlow = .04 + .19 * Math.pow((1 + Math.sin(time * 4.5)) / 2, 2);
    const glow = x.createRadialGradient(0, 0, 3, 0, 0, 31);
    glow.addColorStop(0, `rgba(113,246,255,${smileGlow})`);
    glow.addColorStop(.65, `rgba(113,246,255,${smileGlow * .6})`);
    glow.addColorStop(1, 'rgba(113,246,255,0)');
    x.globalCompositeOperation = 'screen';
    x.fillStyle = glow;
    x.fillRect(-31, -31, 62, 62);
    x.restore();
  }
  function danglingPlug(time, age) {
    const recoil = age >= 0 && age < 1.8 ? Math.sin(age * 13) * .13 * Math.exp(-age * 2) : 0;
    x.save();
    x.translate(512, 801);
    x.rotate(Math.sin(time * 1.65) * .13 + recoil);
    x.lineCap = 'round';
    x.lineJoin = 'round';
    // Flexible cable, with the same shaded rubber and brass pins as the boss.
    x.beginPath();
    x.moveTo(0, 0);
    x.bezierCurveTo(12, 75, -15, 155, 0, 268);
    x.strokeStyle = '#111210';
    x.lineWidth = 10;
    x.stroke();
    x.strokeStyle = '#4d4940';
    x.lineWidth = 5;
    x.stroke();
    x.translate(0, 268);
    x.rotate(Math.sin(time * 1.65 - .45) * .055);
    x.save();
    x.beginPath();
    x.moveTo(-12, 0);
    x.lineTo(12, 0);
    x.lineTo(20, 12);
    x.lineTo(21, 46);
    x.lineTo(12, 48);
    x.lineTo(12, 69);
    x.lineTo(4, 69);
    x.lineTo(4, 49);
    x.lineTo(-5, 49);
    x.lineTo(-5, 69);
    x.lineTo(-13, 69);
    x.lineTo(-13, 48);
    x.lineTo(-21, 46);
    x.lineTo(-20, 12);
    x.closePath();
    x.clip();
    x.drawImage(original, 493, 1058, 44, 73, -22, -1, 44, 73);
    x.restore();
    x.restore();
  }
  function draw(delta = 0) {
    t += delta;
    x.clearRect(0, 0, 1024, 1536);
    if (backgroundOnly) {
      drawRooftop(t);
      return;
    }
    if (!original.naturalWidth) return;
    const age = t - hitAt;
    const impact = age >= 0 && age < .23;
    const kick = age >= 0 && age < .5 ? Math.sin(age / .5 * Math.PI) * 17 : 0;
    const squat = (1 + Math.sin(t * 1.8)) * 4 + kick;
    const sway = Math.sin(t * .9) * .004;
    x.save();
    x.fillStyle = 'rgba(0,0,0,.35)';
    x.beginPath();
    x.ellipse(560, 1487, 390, 27, 0, 0, Math.PI * 2);
    x.fill();
    x.restore();
    piece('leftLeg', 380, 1410, -squat * .00023);
    piece('rightLeg', 790, 1410, squat * .00023);
    x.save();
    x.translate(512, 800 + squat);
    x.rotate(sway + (impact ? Math.sin(age * 100) * .008 : 0));
    x.translate(-512, -800);
    piece('torso', 512, 800);
    piece('leftArm', 303, 500, Math.sin(t * 1.6) * .022);
    piece('rightArm', 735, 550, -Math.sin(t * 1.6 + .7) * .022);
    piece('dish', 414, 170, Math.sin(t * 2) * .012);
    piece('ant1', 546, 170, Math.sin(t * 3) * .018);
    piece('ant2', 652, 173, Math.sin(t * 2.8 + .6) * .018);
    television(t, impact);
    danglingPlug(t, age);
    // Faint signal pulses above the receiver.
    for (let i = 0; i < 2; i++) {
      let q = (t * .5 + i * .5) % 1;
      x.strokeStyle = `rgba(143,220,210,${(1 - q) * .27})`;
      x.lineWidth = 2;
      x.beginPath();
      x.arc(422, 90, 25 + q * 60, -2.3, -.6);
      x.stroke();
    }
    x.restore();
  }
  return {
    draw,
    images,
    hit(animated) {
      channel = nextTvChannel(channel);
      hitAt = animated ? t : -10;
      draw();
    }
  };
}
