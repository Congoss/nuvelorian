export const SHIP_STORAGE_KEY = 'clan-ship-layout-v14';
export const SHIP_ASSET_BASE = '/clan-ship-preview/';
const SHIP_MODULE_COSTS = [100, 110, 120, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 777];
export const SHIP_MODULES = [
  ['hull', 'Стартова платформа', 'Основа корабля', 0, 0, 600, 3],
  ['engine', 'Двигун із сантехніки', 'Складніші сектори', 179, 692, 237, 8],
  ['hangar', 'Голодний ангар', 'Бонус ресурсів', 29, 535, 252, 8],
  ['portal', 'Портальна пральня', 'Особливі вилазки', 430, 528, 157, 8],
  ['core', 'Мозок корабля', 'Покращення модулів', 247, 485, 216, 9],
  ['lab', 'Лабораторія-холодильник', 'Ефект для бою', 379, 452, 208, 8],
  ['garden', 'Оранжерея людожерів', 'Виробництво отрути', 17, 439, 281, 8],
  ['reactor', 'Реактор-шлунок', 'Заряд енергії', 262, 376, 149, 8],
  ['habitat', 'Житловий контейнер', 'Щоденний пайок', 10, 319, 278, 8],
  ['bridge', 'Рубка з автобуса', 'Перші вилазки', 397, 279, 198, 8],
  ['radar', 'Радар-вухо', 'Нові локації', 291, 38, 288, 8],
  ['toilet', 'Капітанський туалет', 'Додатковий голос у вилазках', 38, 84, 336, 8],
  ['jellyfish', 'Медузарій', 'Біологічна навігація', 15, 245, 249, 8],
  ['bar', 'Живий автомат похмілля', 'Підсилення нагород', 236, 252, 173, 8],
].map(([id, name, benefit, x, y, width, z], i) => ({ id, name, benefit, x, y, width, z, angle: 0, type: 'module', level: i + 1, cost: SHIP_MODULE_COSTS[i] * 1000000 }));

export const SHIP_PARTS = [
  ...SHIP_MODULES,
  { id: 'worker-left', name: 'Майстер Зелений', x: 24, y: 590, width: 40, z: 12, angle: 0, type: 'worker' },
  { id: 'worker-right', name: 'Майстер Сонний', x: 535, y: 590, width: 40, z: 12, angle: 0, type: 'worker' },
];
export const createShipLayout = () => Object.fromEntries(SHIP_PARTS.map((p) => [p.id, { x: p.x, y: p.y, width: p.width, z: p.z, angle: p.angle }]));
export const createShipProgress = () => Object.fromEntries(SHIP_MODULES.map(p => [p.id, 0]));
export function validateShipLayout(value) {
  if (!value || typeof value !== 'object') throw new Error('Некоректна розкладка');
  const result = createShipLayout();
  const bounds = { x: [-600, 1200], y: [-900, 1800], width: [20, 900], z: [0, 30], angle: [-180, 180] };
  for (const part of SHIP_PARTS) {
    const entry = value[part.id];
    if (!entry) continue;
    for (const [key, [min, max]] of Object.entries(bounds)) {
      if (typeof entry[key] !== 'number' || !Number.isFinite(entry[key])) throw new Error(`Некоректне поле ${part.id}.${key}`);
      result[part.id][key] = Math.min(max, Math.max(min, entry[key]));
    }
  }
  return result;
}

export const SHIP_ART_DIMENSIONS = {"bar":[272,316],"bridge":[311,400],"core":[338,332],"engine":[372,196],"garden":[441,313],"habitat":[436,379],"hangar":[395,270],"hull":[941,1672],"jellyfish":[390,257],"lab":[326,209],"portal":[246,285],"radar":[451,587],"reactor":[234,267],"toilet":[527,370],"worker-left":[201,1000],"worker-right":[202,1000]};
