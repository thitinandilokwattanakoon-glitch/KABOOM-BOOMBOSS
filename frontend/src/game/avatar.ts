/**
 * The student dress-up character ("avatar"): a cartoon kid with a rounded-square head, drawn from code.
 *
 * Every part is a list of simple shapes (SVG path data + colours) in a 200 x 300 box. The same list is
 * turned into an SVG picture for the pages (sharp at any size) or painted on a canvas for the Phaser
 * battle scene. Adding an item = adding one entry to its table below; nothing else has to change.
 *
 * All art here is original to Kaboom. Do not copy faces or items from other games.
 */

export const AVATAR_W = 200;
export const AVATAR_H = 300;

export const INK = '#23243a';
const WHITE = '#ffffff';
const GOLD = '#ffd23f';
const GOLD_DEEP = '#ffb21c';
const BLUSH = '#ff6f7d';
const MOUTH = '#8c2f3c';
const TONGUE = '#ff8fa3';

// ---------------------------------------------------------------- the outfit

export interface Outfit {
  skin: number;
  face: string;
  hair: string;
  hairColor: number;
  hat: string;
  hatColor: number;
  top: string;
  topColor: number;
  bottom: string;
  bottomColor: number;
  shoes: string;
  shoesColor: number;
  accessory: string;
  accessoryColor: number;
  bag: string;
  bagColor: number;
  /** The face the student drew themselves (used when `face` is 'custom'); see `encodeFaceArt`. */
  faceArt: string;
}

/** Id of the face item that shows the student's own drawing. */
export const CUSTOM_FACE = 'custom';
/** Pen widths of a drawn face, in the units of the 200 x 300 box. */
export const PEN_WIDTHS = [3, 5, 8];
/** Longest drawing the server accepts (characters of the encoded text). */
export const FACE_ART_MAX = 12000;
/** Where drawing is allowed: the face part of the head. */
export const FACE_BOX: [x1: number, y1: number, x2: number, y2: number] = [28, 44, 172, 166];

export interface FaceStroke {
  /** Position in PEN_WIDTHS. */
  pen: number;
  /** x, y, x, y, ... in the 200 x 300 box. */
  points: number[];
}

/**
 * A drawing is saved as plain digits: strokes joined by ';', each "pen,x,y,x,y,..." with the
 * coordinates doubled and rounded (half-unit steps). Only digits, commas and semicolons, so it is safe to store and send.
 */
export function encodeFaceArt(strokes: FaceStroke[]): string {
  return strokes
    .filter((s) => s.points.length >= 2)
    .map((s) => [s.pen, ...s.points.map((v) => Math.round(v * 2))].join(','))
    .join(';');
}

export function decodeFaceArt(art: string): FaceStroke[] {
  if (!art || art.length > FACE_ART_MAX || !/^[0-9,;]*$/.test(art)) return [];
  return art
    .split(';')
    .filter(Boolean)
    .map((text) => {
      const [pen, ...rest] = text.split(',').map(Number);
      return { pen: pen < PEN_WIDTHS.length ? pen : 1, points: rest.slice(0, rest.length - (rest.length % 2)).map((v) => v / 2) };
    })
    .filter((s) => s.points.length >= 2);
}

export type Category = 'face' | 'hair' | 'hat' | 'top' | 'bottom' | 'shoes' | 'accessory' | 'bag';

export const SKIN_TONES = ['#ffe6d3', '#f8cfae', '#eab98b', '#d29a68', '#a9713f', '#70492b'];
export const HAIR_COLORS = ['#2b2233', '#4a3223', '#8a5a33', '#f2c14e', '#e2632f', '#f48fb1', '#4f8fe8', '#eef0f5'];
export const CLOTH_COLORS = ['#ffffff', '#ef4b4b', '#ff9736', '#ffd23f', '#3dbb6c', '#3d8bfd', '#2f3f73', '#8b5cf6', '#ff7eb6', '#343648'];
const SKIN_NAMES = ['ขาวอมชมพู', 'ขาวเหลือง', 'น้ำผึ้ง', 'แทน', 'น้ำตาล', 'น้ำตาลเข้ม'];
const HAIR_NAMES = ['ดำ', 'น้ำตาลเข้ม', 'น้ำตาล', 'ทอง', 'ส้ม', 'ชมพู', 'ฟ้า', 'ขาว'];
const CLOTH_NAMES = ['ขาว', 'แดง', 'ส้ม', 'เหลือง', 'เขียว', 'ฟ้า', 'กรมท่า', 'ม่วง', 'ชมพู', 'ดำ'];

// ---------------------------------------------------------------- shapes

type Rot = [deg: number, cx: number, cy: number];

interface Shape {
  d: string;
  fill?: string;
  stroke?: string;
  sw?: number;
  rot?: Rot;
  o?: number;
}

type Layer =
  | 'bagBack'
  | 'hairBack'
  | 'legs'
  | 'shoes'
  | 'bottom'
  | 'torso'
  | 'arms'
  | 'bagFront'
  | 'head'
  | 'face'
  | 'hairFront'
  | 'neck'
  | 'glasses'
  | 'hat';

const ORDER: Layer[] = ['bagBack', 'hairBack', 'legs', 'shoes', 'bottom', 'torso', 'arms', 'bagFront', 'head', 'face', 'hairFront', 'neck', 'glasses', 'hat'];

type Parts = Partial<Record<Layer, Shape[]>>;

/** Filled shape with the ink outline. */
const P = (d: string, fill: string, sw = 4): Shape => ({ d, fill, stroke: INK, sw });
/** Fill only. */
const F = (d: string, fill: string, o?: number): Shape => ({ d, fill, o });
/** Line only. */
const L = (d: string, sw = 3, stroke = INK): Shape => ({ d, stroke, sw });
/** A coloured line with an ink edge (two strokes on top of each other). */
const band = (d: string, width: number, color: string): Shape[] => [L(d, width + 5, INK), L(d, width, color)];

const rr = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
const el = (cx: number, cy: number, rx: number, ry: number) =>
  `M${cx - rx} ${cy}A${rx} ${ry} 0 1 0 ${cx + rx} ${cy}A${rx} ${ry} 0 1 0 ${cx - rx} ${cy}Z`;
const circle = (cx: number, cy: number, r: number) => el(cx, cy, r, r);
/** Mirror an x coordinate across the middle of the body. */
const mx = (x: number) => AVATAR_W - x;

function mix(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (shift: number) => {
    const va = (pa >> shift) & 255;
    const vb = (pb >> shift) & 255;
    return Math.round(va + (vb - va) * t);
  };
  return `#${((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1)}`;
}
const darker = (c: string, t = 0.24) => mix(c, '#1b1d33', t);
const lighter = (c: string, t = 0.4) => mix(c, WHITE, t);

/** Colours handed to an item: its own colour (with a darker and a lighter shade) and the character's skin. */
interface Paint {
  c: string;
  cd: string;
  cl: string;
  skin: string;
}

type Draw = (p: Paint) => Parts;

interface Item {
  id: string;
  /** Thai name, read by screen readers and shown as a tooltip. */
  label: string;
  draw: Draw;
}

// ---------------------------------------------------------------- body

export const HEAD = rr(22, 34, 156, 138, 48);
const TORSO = rr(62, 160, 76, 80, 18);
/** Outline of the hair over the top of the head, from the left side at `y` round to the right side at `y`. */
const hairTop = (y: number) => `M18 ${y}V82A52 52 0 0 1 70 30H130A52 52 0 0 1 182 82V${y}`;

function legs(skin: string): Shape[] {
  return [P(rr(72, 228, 24, 50, 9), skin), P(rr(104, 228, 24, 50, 9), skin)];
}

/** Both arms. Short sleeves show the arm; long sleeves show only the hand. */
function arms(p: Paint, sleeve: string, long: boolean, cuff?: string): Shape[] {
  const out: Shape[] = [];
  for (const left of [true, false]) {
    const x = left ? 42 : 136;
    const rot: Rot = left ? [13, 58, 180] : [-13, 142, 180];
    if (long) {
      out.push({ ...P(circle(x + 11, 229, 10.5), p.skin), rot });
      out.push({ ...P(rr(x, 172, 22, 54, 11), sleeve), rot });
      if (cuff) out.push({ ...P(rr(x - 1, 216, 24, 10, 4), cuff, 3), rot });
    } else {
      out.push({ ...P(rr(x, 172, 22, 68, 11), p.skin), rot });
      out.push({ ...P(rr(x - 1, 170, 24, 30, 10), sleeve), rot });
      if (cuff) out.push({ ...F(rr(x + 1, 192, 20, 6, 2), cuff), rot });
    }
  }
  return out;
}

// ---------------------------------------------------------------- faces

const eye = (x: number, rx = 8, ry = 11): Shape[] => [F(el(x, 106, rx, ry), INK), F(el(x - 2.5, 102, 2.8, 3.4), WHITE)];
const eyes = (rx = 8, ry = 11): Shape[] => [...eye(72, rx, ry), ...eye(128, rx, ry)];
const blush = (o = 0.42, rx = 12): Shape[] => [F(el(48, 128, rx, 7), BLUSH, o), F(el(152, 128, rx, 7), BLUSH, o)];
const openSmile: Shape[] = [P('M85 130Q100 152 115 130Z', MOUTH, 3.5), F(el(100, 141.5, 6.5, 4), TONGUE)];
const star4 = (cx: number, cy: number, r: number) => {
  const k = r * 0.3;
  return `M${cx} ${cy - r}L${cx + k} ${cy - k}L${cx + r} ${cy}L${cx + k} ${cy + k}L${cx} ${cy + r}L${cx - k} ${cy + k}L${cx - r} ${cy}L${cx - k} ${cy - k}Z`;
};

const FACES: Item[] = [
  { id: 'smile', label: 'ยิ้ม', draw: () => ({ face: [...eyes(), ...blush(), L('M86 132Q100 146 114 132', 4)] }) },
  {
    id: 'grin',
    label: 'ยิ้มกว้าง',
    draw: () => ({
      face: [
        L('M61 110Q72 96 83 110', 4),
        L('M117 110Q128 96 139 110', 4),
        ...blush(),
        P('M80 126H120Q120 150 100 150Q80 150 80 126Z', MOUTH, 3.5),
        F('M83.5 128H116.5V134H83.5Z', WHITE),
        F(el(100, 144, 9, 4.5), TONGUE)
      ]
    })
  },
  { id: 'wink', label: 'ขยิบตา', draw: () => ({ face: [...eye(72), L('M117 108Q128 97 139 108', 4), ...blush(), ...openSmile] }) },
  {
    id: 'brave',
    label: 'มุ่งมั่น',
    draw: () => ({ face: [...eyes(), L('M57 85L84 94', 5), L('M143 85L116 94', 5), L('M84 134Q100 145 116 134', 4)] })
  },
  {
    id: 'wow',
    label: 'ตกใจ',
    draw: () => ({
      face: [...eyes(9, 12.5), L('M61 85Q72 78 83 85', 3.5), L('M117 85Q128 78 139 85', 3.5), ...blush(0.3), P(el(100, 139, 7, 9), MOUTH, 3.5)]
    })
  },
  {
    id: 'shy',
    label: 'เขินอาย',
    draw: () => ({ face: [L('M61 103Q72 114 83 103', 4), L('M117 103Q128 114 139 103', 4), ...blush(0.62, 14), L('M92 134Q100 140 108 134', 3.5)] })
  },
  { id: 'cat', label: 'ยิ้มแมว', draw: () => ({ face: [...eyes(), ...blush(), L('M86 132Q93 142 100 132Q107 142 114 132', 3.5)] }) },
  {
    id: 'starry',
    label: 'ตาเป็นประกาย',
    draw: () => ({ face: [P(star4(72, 106, 15), GOLD, 3), P(star4(128, 106, 15), GOLD, 3), ...blush(), ...openSmile] })
  },
  // The student's own drawing: its lines come from `outfit.faceArt` (see shapesOf), not from here.
  { id: CUSTOM_FACE, label: 'วาดหน้าเอง', draw: () => ({}) }
];

function faceArtShapes(art: string): Shape[] {
  return decodeFaceArt(art).map((s) => {
    const [x, y, ...rest] = s.points;
    let d = `M${x} ${y}`;
    // a dot: one point is drawn as a tiny line so the round pen tip shows
    if (rest.length === 0) d += `L${x + 0.01} ${y}`;
    for (let i = 0; i < rest.length; i += 2) d += `L${rest[i]} ${rest[i + 1]}`;
    return L(d, PEN_WIDTHS[s.pen]);
  });
}

// ---------------------------------------------------------------- hair

const strand = (d: string, p: Paint): Shape => L(d, 2.5, p.cl);

const HAIRS: Item[] = [
  {
    id: 'short',
    label: 'ผมสั้น',
    draw: (p) => ({
      hairFront: [
        P(`${hairTop(104)}Q172 104 170 92Q168 74 150 70Q126 66 108 78Q98 62 76 64Q50 66 34 82Q30 92 30 100Q24 106 18 104Z`, p.c),
        strand('M46 54Q72 40 104 44', p)
      ]
    })
  },
  {
    id: 'bob',
    label: 'ผมบ๊อบ',
    draw: (p) => ({
      hairBack: [P(rr(12, 28, 176, 152, 56), p.c)],
      hairFront: [P(`${hairTop(112)}Q170 110 170 84Q100 68 30 84Q30 110 18 112Z`, p.c), strand('M70 78V66M100 75V62M130 78V66', p)]
    })
  },
  {
    id: 'spiky',
    label: 'ผมตั้ง',
    draw: (p) => ({
      hairFront: [
        P(
          'M18 100V84L8 62L27 66L22 36L45 48L50 13L73 35L91 5L108 33L132 7L141 39L167 20L165 51L190 45L181 78L182 100Q172 98 170 86L157 70L146 86L129 68L114 86L98 68L82 86L67 70L54 86L41 74L30 88Q28 98 18 100Z',
          p.c
        )
      ]
    })
  },
  {
    id: 'twin',
    label: 'ผมแกละ',
    draw: (p) => ({
      hairBack: [P(el(16, 134, 13, 34), p.c), P(el(184, 134, 13, 34), p.c), P(rr(5, 96, 22, 11, 4), BLUSH, 3), P(rr(173, 96, 22, 11, 4), BLUSH, 3)],
      hairFront: [P(`${hairTop(100)}Q172 98 170 88Q164 62 100 44Q36 62 30 88Q28 98 18 100Z`, p.c), strand('M58 50Q76 40 94 40', p)]
    })
  },
  {
    id: 'bun',
    label: 'ผมมวย',
    draw: (p) => ({
      hairFront: [
        P(circle(100, 22, 18), p.c),
        P(`${hairTop(100)}Q172 98 170 88Q160 66 128 62Q102 60 86 74Q66 62 46 70Q32 78 30 88Q28 98 18 100Z`, p.c),
        strand('M92 16Q100 10 108 16', p)
      ]
    })
  },
  {
    id: 'curly',
    label: 'ผมหยิก',
    draw: (p) => ({
      hairBack: [
        [30, 78],
        [38, 50],
        [64, 30],
        [100, 22],
        [136, 30],
        [162, 50],
        [170, 78]
      ].map(([x, y]) => P(circle(x, y, 24), p.c)),
      hairFront: [
        [50, 64],
        [76, 54],
        [102, 51],
        [128, 55],
        [151, 65]
      ].map(([x, y]) => P(circle(x, y, 17), p.c))
    })
  },
  {
    id: 'long',
    label: 'ผมยาว',
    draw: (p) => ({
      hairBack: [P('M10 86A56 56 0 0 1 66 30H134A56 56 0 0 1 190 86V214Q190 232 172 232H28Q10 232 10 214Z', p.c)],
      hairFront: [P(`${hairTop(98)}Q172 96 170 86Q150 64 112 70Q96 76 86 66Q56 62 30 86Q28 96 18 98Z`, p.c), strand('M48 54Q74 42 100 44', p)]
    })
  }
];

// ---------------------------------------------------------------- hats

const NONE: Item = { id: 'none', label: 'ไม่ใส่', draw: () => ({}) };

const HATS: Item[] = [
  NONE,
  {
    id: 'cap',
    label: 'หมวกแก๊ป',
    draw: (p) => ({
      hat: [
        P('M22 74Q18 10 100 10Q182 10 178 74Q100 62 22 74Z', p.c),
        P('M30 72Q100 58 170 72Q178 86 160 90Q100 78 40 90Q22 86 30 72Z', p.cd),
        P(circle(100, 11, 5), p.cd, 3),
        P(circle(100, 40, 13), WHITE, 3),
        F('M103 31L94 42H100L97 50L106 38H100Z', GOLD_DEEP)
      ]
    })
  },
  {
    id: 'beanie',
    label: 'หมวกไหมพรม',
    draw: (p) => ({
      hat: [
        P('M20 70Q16 8 100 8Q184 8 180 70Z', p.c),
        P(rr(14, 56, 172, 26, 11), p.cl),
        L('M40 62V76M64 62V76M88 62V76M112 62V76M136 62V76M160 62V76', 2.5, p.cd),
        P(circle(100, 12, 10), p.cl)
      ]
    })
  },
  {
    id: 'crown',
    label: 'มงกุฎ',
    draw: (p) => ({
      hat: [
        P('M44 64V26L64 44L82 10L100 38L118 10L136 44L156 26V64Z', GOLD),
        P(rr(42, 52, 116, 14, 4), GOLD_DEEP, 3.5),
        P(circle(72, 59, 4.5), p.c, 2.5),
        P(circle(100, 59, 4.5), p.c, 2.5),
        P(circle(128, 59, 4.5), p.c, 2.5)
      ]
    })
  },
  {
    id: 'catears',
    label: 'ที่คาดผมหูแมว',
    draw: (p) => ({
      hat: [
        ...band('M24 82Q24 30 100 28Q176 30 176 82', 6, p.c),
        P('M34 54L40 8L80 30Z', p.c),
        F('M44 44L46 21L65 32Z', '#ffb3c7'),
        P('M166 54L160 8L120 30Z', p.c),
        F('M156 44L154 21L135 32Z', '#ffb3c7')
      ]
    })
  },
  {
    id: 'grad',
    label: 'หมวกบัณฑิต',
    draw: (p) => ({
      hat: [
        P('M46 68Q44 34 100 34Q156 34 154 68Q100 58 46 68Z', p.cd),
        P('M100 6L188 30L100 54L12 30Z', p.c),
        ...band('M100 30L150 40V62', 2.5, GOLD),
        P(rr(144, 60, 12, 18, 4), GOLD, 3),
        P(circle(100, 30, 4.5), GOLD, 2.5)
      ]
    })
  },
  {
    id: 'bow',
    label: 'โบว์ติดผม',
    draw: (p) => ({
      hat: [
        P('M146 42Q120 18 111 30Q105 46 118 58Q132 54 146 42Z', p.c),
        P('M146 42Q172 18 181 30Q187 46 174 58Q160 54 146 42Z', p.c),
        P(rr(139, 33, 14, 18, 5), p.cd)
      ]
    })
  }
];

// ---------------------------------------------------------------- tops

const torso = (c: string): Shape => P(TORSO, c);

const TOPS: Item[] = [
  {
    id: 'shirt',
    label: 'เสื้อนักเรียน',
    draw: (p) => ({
      torso: [
        torso(p.c),
        L('M100 190V238', 2.5, p.cd),
        F(circle(100, 204, 2.6), p.cd),
        F(circle(100, 220, 2.6), p.cd),
        P('M82 172L100 190L90 198L77 181Z', lighter(p.c, 0.55), 3),
        P('M118 172L100 190L110 198L123 181Z', lighter(p.c, 0.55), 3),
        P(rr(110, 200, 16, 15, 3), p.c, 2.5),
        F(circle(118, 207.5, 3), '#3d63d9')
      ],
      arms: arms(p, p.c, false)
    })
  },
  {
    id: 'tee',
    label: 'เสื้อยืด',
    draw: (p) => ({
      torso: [torso(p.c), F('M105 190L90 211H100L95 228L112 205H101Z', p.c === WHITE ? GOLD_DEEP : WHITE), L('M105 190L90 211H100L95 228L112 205H101Z', 2)],
      arms: arms(p, p.c, false)
    })
  },
  {
    id: 'hoodie',
    label: 'เสื้อฮู้ด',
    draw: (p) => ({
      torso: [
        torso(p.c),
        P(rr(78, 210, 44, 20, 8), p.cd, 3),
        F('M64 230H136V234Q136 238 128 238H72Q64 238 64 234Z', p.cd),
        ...band('M91 176V194', 2, WHITE),
        ...band('M109 176V194', 2, WHITE)
      ],
      arms: arms(p, p.c, true, p.cd)
    })
  },
  {
    id: 'stripe',
    label: 'เสื้อลาย',
    draw: (p) => {
      const line = p.c === WHITE ? '#3d8bfd' : WHITE;
      return {
        torso: [F(TORSO, p.c), F('M64 184H136V193H64Z', line), F('M64 202H136V211H64Z', line), F('M64 220H136V229H64Z', line), L(TORSO, 4)],
        arms: arms(p, p.c, false, line)
      };
    }
  },
  {
    id: 'jersey',
    label: 'เสื้อกีฬา',
    draw: (p) => {
      const trim = p.c === WHITE ? '#ef4b4b' : WHITE;
      return {
        torso: [
          F(TORSO, p.c),
          F('M64 172H73V238H70Q64 238 64 230Z', trim),
          F('M136 172H127V238H130Q136 238 136 230Z', trim),
          F('M84 172L100 192L116 172H108L100 182L92 172Z', trim),
          P(circle(100, 212, 11), trim, 3),
          F(star4(100, 212, 8), p.c),
          L(TORSO, 4)
        ],
        arms: arms(p, p.c, false, trim)
      };
    }
  },
  {
    id: 'tunic',
    label: 'เสื้อผู้กล้า',
    draw: (p) => ({
      torso: [
        torso(p.c),
        L('M92 174L100 190L108 174', 3),
        L('M100 190V214', 2.5, p.cd),
        P('M62 212H138V224H62Z', '#8a5a33', 3.5),
        P(rr(92, 209, 16, 18, 4), GOLD, 3),
        F(rr(97, 214, 6, 8, 2), '#8a5a33')
      ],
      arms: arms(p, p.cd, true, GOLD)
    })
  }
];

// ---------------------------------------------------------------- bottoms

const SHORTS = 'M68 230Q68 224 74 224H126Q132 224 132 230V248Q132 254 126 254H108Q102 254 102 248V242H98V248Q98 254 92 254H74Q68 254 68 248Z';
const PANTS = 'M68 230Q68 224 74 224H126Q132 224 132 230V268Q132 274 126 274H108Q102 274 102 268V242H98V268Q98 274 92 274H74Q68 274 68 268Z';

const BOTTOMS: Item[] = [
  { id: 'shorts', label: 'กางเกงขาสั้น', draw: (p) => ({ bottom: [P(SHORTS, p.c), L('M100 226V242', 2.5, p.cd)] }) },
  { id: 'pants', label: 'กางเกงขายาว', draw: (p) => ({ bottom: [P(PANTS, p.c), L('M100 226V242', 2.5, p.cd)] }) },
  {
    id: 'skirt',
    label: 'กระโปรง',
    draw: (p) => ({ bottom: [P('M70 224H130L142 252Q100 262 58 252Z', p.c), L('M84 240L80 256M100 240V258M116 240L120 256', 2.5, p.cd)] })
  },
  {
    id: 'jeans',
    label: 'กางเกงยีนส์',
    draw: (p) => ({
      bottom: [
        P(PANTS, p.c),
        F('M70 262H96V270Q96 272 92 272H74Q70 272 70 268Z', p.cl),
        F('M104 262H130V268Q130 272 126 272H108Q104 272 104 270Z', p.cl),
        L('M100 226V242', 2.5, p.cd),
        L('M72 246Q80 250 84 242M128 246Q120 250 116 242', 2, p.cd),
        L(PANTS, 4)
      ]
    })
  },
  {
    id: 'sport',
    label: 'กางเกงกีฬา',
    draw: (p) => {
      const trim = p.c === WHITE ? '#ef4b4b' : WHITE;
      return { bottom: [F(SHORTS, p.c), F('M69 228H76V253H74Q69 253 69 248Z', trim), F('M131 228H124V253H126Q131 253 131 248Z', trim), L('M100 226V242', 2.5, p.cd), L(SHORTS, 4)] };
    }
  }
];

// ---------------------------------------------------------------- shoes

/** Draws the left shoe from `one(x)` and mirrors it for the right one. */
const pair = (one: (flip: (x: number) => number) => Shape[]): Shape[] => [...one((x) => x), ...one(mx)];
/** Rounded box from x1 to x2 that still works after mirroring. */
const box = (f: (x: number) => number, x1: number, y: number, x2: number, h: number, r: number) => rr(Math.min(f(x1), f(x2)), y, Math.abs(x2 - x1), h, r);

const SHOES: Item[] = [
  {
    id: 'sneaker',
    label: 'รองเท้าผ้าใบ',
    draw: (p) => ({
      shoes: pair((f) => [
        P(box(f, 62, 268, 98, 26, 11), p.c),
        F(box(f, 64, 285, 96, 7, 3.5), WHITE),
        L(box(f, 62, 268, 98, 26, 11), 4),
        L(`M${f(74)} 276H${f(88)}`, 2.5, p.c === WHITE ? p.cd : WHITE)
      ])
    })
  },
  {
    id: 'boots',
    label: 'รองเท้าบูต',
    draw: (p) => ({
      shoes: pair((f) => [P(box(f, 64, 250, 98, 44, 10), p.c), P(box(f, 62, 248, 100, 12, 5), p.cl, 3), F(box(f, 66, 286, 96, 6, 3), p.cd)])
    })
  },
  {
    id: 'school',
    label: 'รองเท้านักเรียน',
    draw: (p) => ({
      shoes: pair((f) => [P(box(f, 70, 252, 98, 22, 6), WHITE, 3.5), P(box(f, 62, 270, 98, 24, 11), p.c), L(`M${f(72)} 279H${f(90)}`, 2.5, p.cl)])
    })
  },
  {
    id: 'sandal',
    label: 'รองเท้าแตะ',
    draw: (p) => ({
      shoes: pair((f) => [P(box(f, 62, 284, 100, 10, 5), p.cd, 3.5), ...band(`M${f(68)} 284Q${f(84)} 264 ${f(98)} 284`, 4, p.c)])
    })
  }
];

// ---------------------------------------------------------------- accessories

const ACCESSORIES: Item[] = [
  NONE,
  {
    id: 'bowtie',
    label: 'โบว์หูกระต่าย',
    draw: (p) => ({
      neck: [P('M100 182L82 170Q78 182 82 194Z', p.c, 3.5), P('M100 182L118 170Q122 182 118 194Z', p.c, 3.5), P(rr(94.5, 176, 11, 12, 4), p.cd, 3)]
    })
  },
  {
    id: 'tie',
    label: 'เนกไท',
    draw: (p) => ({ neck: [P('M95 180L91 208L100 220L109 208L105 180Z', p.c, 3.5), P('M93 172H107L105 182H95Z', p.cd, 3)] })
  },
  {
    id: 'scarf',
    label: 'ผ้าพันคอ',
    draw: (p) => ({
      neck: [
        P(rr(112, 176, 18, 38, 6), p.c, 3.5),
        L('M116 206V212M121 206V212M126 206V212', 2, p.cd),
        P(rr(58, 164, 84, 20, 10), p.c),
        L('M76 166V182M96 166V182M116 166V182', 2.5, p.cl)
      ]
    })
  },
  {
    id: 'glasses',
    label: 'แว่นตา',
    draw: (p) => ({
      glasses: [
        F(circle(72, 107, 17), WHITE, 0.28),
        F(circle(128, 107, 17), WHITE, 0.28),
        L(circle(72, 107, 17), 4.5, p.c),
        L(circle(128, 107, 17), 4.5, p.c),
        L('M89 105Q100 99 111 105', 4, p.c),
        L('M55 104L26 98M145 104L174 98', 4, p.c)
      ]
    })
  },
  {
    id: 'medal',
    label: 'เหรียญรางวัล',
    draw: (p) => ({
      neck: [...band('M82 174L100 202L118 174', 5, p.c), P(circle(100, 208, 11), GOLD, 3.5), F(star4(100, 208, 7), GOLD_DEEP)]
    })
  }
];

// ---------------------------------------------------------------- bags (things worn on the back)

const BAGS: Item[] = [
  NONE,
  {
    id: 'backpack',
    label: 'กระเป๋าเป้',
    draw: (p) => ({
      bagBack: [P(rr(44, 170, 112, 70, 24), p.c)],
      bagFront: [P(rr(69, 172, 11, 52, 4), p.cd, 3), P(rr(120, 172, 11, 52, 4), p.cd, 3)]
    })
  },
  {
    id: 'satchel',
    label: 'กระเป๋าสะพายข้าง',
    draw: (p) => ({
      bagFront: [
        ...band('M72 174L132 226', 6, p.cd),
        P(rr(118, 212, 36, 30, 7), p.c),
        P('M118 219Q118 212 125 212H147Q154 212 154 219V224Q136 234 118 224Z', p.cl, 3),
        P(circle(136, 229, 3.5), GOLD, 2.5)
      ]
    })
  },
  {
    id: 'cape',
    label: 'ผ้าคลุมฮีโร่',
    draw: (p) => ({
      bagBack: [P('M66 172Q38 226 30 280Q64 292 100 284Q136 292 170 280Q162 226 134 172Z', p.c), L('M64 232Q62 262 66 284M136 232Q138 262 134 284', 2.5, p.cd)],
      bagFront: [P(rr(74, 171, 52, 11, 5), p.c, 3.5), P(circle(100, 176.5, 6.5), GOLD, 3)]
    })
  },
  {
    id: 'wings',
    label: 'ปีก',
    draw: (p) => ({
      bagBack: pair((f) => [
        P(
          `M${f(70)} 190Q${f(40)} 150 ${f(8)} 160Q${f(2)} 178 ${f(16)} 190Q${f(8)} 202 ${f(20)} 212Q${f(18)} 224 ${f(34)} 228Q${f(54)} 230 ${f(70)} 214Z`,
          p.c === '#343648' ? '#4b4e66' : lighter(p.c, 0.25)
        ),
        L(`M${f(22)} 188Q${f(40)} 190 ${f(56)} 198M${f(26)} 210Q${f(42)} 210 ${f(58)} 212`, 2.5, p.cd)
      ])
    })
  }
];

// ---------------------------------------------------------------- catalogue (what the dress-up page shows)

export type Box = [x: number, y: number, w: number, h: number];

export interface CategoryInfo {
  id: Category;
  /** Heading above the grid, in English like the concept art. */
  title: string;
  /** Thai name for the round button in the side bar. */
  label: string;
  colorTitle: string;
  colorKey: keyof Outfit;
  colors: string[];
  /** Thai colour names, in the same order as `colors`. */
  colorNames: string[];
  items: Item[];
  /** Square part of the character shown in the tiles of this category. */
  view: Box;
  /** Things taken off in the tiles because they would hide the item. */
  hide?: Partial<Outfit>;
}

const cloth = { colors: CLOTH_COLORS, colorNames: CLOTH_NAMES, colorTitle: 'Color' };

export const CATEGORIES: CategoryInfo[] = [
  { id: 'face', title: 'Face', label: 'หน้า', colorTitle: 'Skin tone', colorKey: 'skin', colors: SKIN_TONES, colorNames: SKIN_NAMES, items: FACES, view: [14, 20, 172, 172], hide: { hat: 'none', accessory: 'none' } },
  { id: 'hair', title: 'Hair', label: 'ทรงผม', colorTitle: 'Hair color', colorKey: 'hairColor', colors: HAIR_COLORS, colorNames: HAIR_NAMES, items: HAIRS, view: [0, 2, 200, 200], hide: { hat: 'none' } },
  { id: 'hat', title: 'Hat', label: 'หมวก', colorKey: 'hatColor', ...cloth, items: HATS, view: [4, 0, 192, 192] },
  { id: 'top', title: 'Top', label: 'เสื้อ', colorKey: 'topColor', ...cloth, items: TOPS, view: [40, 158, 120, 120], hide: { accessory: 'none', bag: 'none' } },
  { id: 'bottom', title: 'Bottom', label: 'กางเกง กระโปรง', colorKey: 'bottomColor', ...cloth, items: BOTTOMS, view: [44, 192, 112, 112], hide: { bag: 'none' } },
  { id: 'shoes', title: 'Shoes', label: 'รองเท้า', colorKey: 'shoesColor', ...cloth, items: SHOES, view: [54, 212, 92, 92], hide: { bag: 'none' } },
  { id: 'accessory', title: 'Accessory', label: 'เครื่องประดับ', colorKey: 'accessoryColor', ...cloth, items: ACCESSORIES, view: [24, 68, 152, 152], hide: { bag: 'none' } },
  { id: 'bag', title: 'Backpack', label: 'กระเป๋า', colorKey: 'bagColor', ...cloth, items: BAGS, view: [2, 108, 196, 196] }
];

const BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]));

function find(cat: Category, id: string): Item {
  const info = BY_ID.get(cat)!;
  return info.items.find((i) => i.id === id) ?? info.items[0];
}

// ---------------------------------------------------------------- outfits

const BASE: Outfit = {
  skin: 1,
  face: 'smile',
  hair: 'short',
  hairColor: 0,
  hat: 'none',
  hatColor: 1,
  top: 'shirt',
  topColor: 0,
  bottom: 'shorts',
  bottomColor: 6,
  shoes: 'sneaker',
  shoesColor: 9,
  accessory: 'none',
  accessoryColor: 1,
  bag: 'none',
  bagColor: 5,
  faceArt: ''
};

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * The look of a student who has not dressed up yet. With a `seed` (the student id) the hair, face and
 * shirt colour vary a little, so a room of new players does not look like identical twins.
 */
export function defaultOutfit(seed?: string): Outfit {
  if (!seed) return { ...BASE };
  const h = hash(seed);
  const hairs = ['short', 'bob', 'spiky', 'twin', 'bun', 'long'];
  const faces = ['smile', 'grin', 'cat', 'wink'];
  const tops = [0, 3, 4, 5, 8, 2];
  return {
    ...BASE,
    hair: hairs[h % hairs.length],
    hairColor: (h >>> 4) % 3,
    face: faces[(h >>> 8) % faces.length],
    topColor: tops[(h >>> 12) % tops.length],
    bottom: (h >>> 16) % 3 === 0 ? 'skirt' : 'shorts'
  };
}

const ITEM_KEYS: Category[] = ['face', 'hair', 'hat', 'top', 'bottom', 'shoes', 'accessory', 'bag'];

/** Turns anything (a server answer, old data) into a complete outfit; unknown items fall back to `fallback`. */
export function normalizeOutfit(raw: unknown, fallback: Outfit = BASE): Outfit {
  const src = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const out: Outfit = { ...fallback };
  const index = (key: keyof Outfit, max: number) => {
    const v = src[key];
    if (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < max) (out[key] as number) = v;
  };
  for (const info of CATEGORIES) {
    const v = src[info.id];
    if (typeof v === 'string' && info.items.some((i) => i.id === v)) (out[info.id] as string) = v;
    index(info.colorKey, info.colors.length);
  }
  if (typeof src.faceArt === 'string' && decodeFaceArt(src.faceArt).length > 0) out.faceArt = src.faceArt;
  // "My own drawing" without a drawing would be an empty face.
  if (out.face === CUSTOM_FACE && !out.faceArt) out.face = fallback.face === CUSTOM_FACE ? BASE.face : fallback.face;
  return out;
}

const pick = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)];

/** A random look. The skin tone stays: that one is a personal choice, not a costume. */
export function randomOutfit(current: Outfit): Outfit {
  const next: Outfit = { ...current };
  for (const info of CATEGORIES) {
    // the dice never takes away (or picks) the face the student drew
    if (info.id === 'face' && current.face === CUSTOM_FACE) continue;
    (next[info.id] as string) = pick(info.items.filter((i) => i.id !== CUSTOM_FACE)).id;
    if (info.colorKey !== 'skin') (next[info.colorKey] as number) = Math.floor(Math.random() * info.colors.length);
  }
  // Mostly-natural hair colours, and not everything at once on the head and the back.
  if (Math.random() < 0.6) next.hairColor = Math.floor(Math.random() * 4);
  if (Math.random() < 0.45) next.hat = 'none';
  if (Math.random() < 0.5) next.accessory = 'none';
  if (Math.random() < 0.5) next.bag = 'none';
  return next;
}

export function sameOutfit(a: Outfit, b: Outfit): boolean {
  return (Object.keys(a) as (keyof Outfit)[]).every((k) => a[k] === b[k]);
}

// ---------------------------------------------------------------- drawing

function paint(color: string, skin: string): Paint {
  return { c: color, cd: darker(color), cl: lighter(color), skin };
}

function shapesOf(o: Outfit): Shape[] {
  const skin = SKIN_TONES[o.skin] ?? SKIN_TONES[BASE.skin];
  const layers: Parts = { legs: legs(skin), head: [P(HEAD, skin)] };
  for (const cat of ITEM_KEYS) {
    const info = BY_ID.get(cat)!;
    const color = cat === 'face' ? skin : info.colors[o[info.colorKey] as number] ?? info.colors[0];
    const parts = find(cat, o[cat]).draw(paint(color, skin));
    for (const key of Object.keys(parts) as Layer[]) layers[key] = [...(layers[key] ?? []), ...(parts[key] ?? [])];
  }
  if (o.face === CUSTOM_FACE) layers.face = faceArtShapes(o.faceArt);
  return ORDER.flatMap((layer) => layers[layer] ?? []);
}

const SHADOW = F(el(100, 291, 58, 8), INK, 0.2);

export interface AvatarOptions {
  /** Part of the 200 x 300 box to show (default: all of it). */
  view?: Box;
  /** Soft shadow under the feet. */
  shadow?: boolean;
}

/** The character as SVG markup. */
export function avatarSvg(outfit: Outfit, { view = [0, 0, AVATAR_W, AVATAR_H], shadow = false }: AvatarOptions = {}): string {
  const shapes = shadow ? [SHADOW, ...shapesOf(outfit)] : shapesOf(outfit);
  const body = shapes
    .map((s) => {
      let a = `d="${s.d}" fill="${s.fill ?? 'none'}"`;
      if (s.stroke) a += ` stroke="${s.stroke}" stroke-width="${s.sw ?? 3}"`;
      if (s.o !== undefined) a += ` opacity="${s.o}"`;
      if (s.rot) a += ` transform="rotate(${s.rot.join(' ')})"`;
      return `<path ${a}/>`;
    })
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${view.join(' ')}" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}

/** The character as an address for an <img>. */
export function avatarImage(outfit: Outfit, options?: AvatarOptions): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(avatarSvg(outfit, options))}`;
}

/** Just the head, for the small round pictures beside names. */
export const HEAD_VIEW: Box = [10, 16, 180, 180];

/** The character painted on a canvas `height` pixels tall (used as a texture in the battle scene). */
export function avatarCanvas(outfit: Outfit, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const k = height / AVATAR_H;
  canvas.width = Math.round(AVATAR_W * k);
  canvas.height = Math.round(height);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.scale(k, k);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const s of shapesOf(outfit)) {
    const path = new Path2D(s.d);
    ctx.save();
    if (s.o !== undefined) ctx.globalAlpha = s.o;
    if (s.rot) {
      const [deg, cx, cy] = s.rot;
      ctx.translate(cx, cy);
      ctx.rotate((deg * Math.PI) / 180);
      ctx.translate(-cx, -cy);
    }
    if (s.fill) {
      ctx.fillStyle = s.fill;
      ctx.fill(path);
    }
    if (s.stroke) {
      ctx.strokeStyle = s.stroke;
      ctx.lineWidth = s.sw ?? 3;
      ctx.stroke(path);
    }
    ctx.restore();
  }
  return canvas;
}

// ================================================================ the boss (the teacher's character)
//
// Same idea as the student character, drawn larger: a head (the teacher's photo, or a cartoon face),
// horns, an outfit, a cape and a weapon. It is always painted on a canvas, because a photo cannot be
// put inside an SVG picture.

export const BOSS_W = 260;
export const BOSS_H = 300;
/** The boss is drawn around x = 100 like the students, so its box starts left of zero. */
const BOSS_LEFT = -30;

export interface BossLook {
  /** 'photo' = the uploaded picture is the face; 'cartoon' = a drawn face. */
  head: 'photo' | 'cartoon';
  skin: number;
  face: string;
  faceArt: string;
  hair: string;
  hairColor: number;
  horns: string;
  hornsColor: number;
  robe: string;
  robeColor: number;
  cape: string;
  capeColor: number;
  weapon: string;
}

export type BossPart = 'face' | 'hair' | 'horns' | 'robe' | 'cape' | 'weapon';

export const BOSS_SKINS = [...SKIN_TONES, '#e8635a', '#a57be0', '#74c47a', '#8fa6cc'];
const BOSS_SKIN_NAMES = [...SKIN_NAMES, 'แดง', 'ม่วง', 'เขียว', 'เทา'];

const BOSS_FACES: Item[] = [
  {
    id: 'evil',
    label: 'จอมมาร',
    draw: () => ({
      face: [
        ...eyes(),
        L('M55 84L86 96', 5.5),
        L('M145 84L114 96', 5.5),
        P('M80 128H120Q120 148 100 148Q80 148 80 128Z', MOUTH, 3.5),
        F('M86 129L91 138L96 129Z', WHITE),
        F('M104 129L109 138L114 129Z', WHITE)
      ]
    })
  },
  ...FACES
];

const BOSS_HAIRS: Item[] = [{ id: 'none', label: 'ไม่มีผม', draw: () => ({}) }, ...HAIRS];

/** Horn shapes are returned for the left side and mirrored. */
const horn = (d: (f: (x: number) => number) => string, color: string): Shape[] => pair((f) => [P(d(f), color)]);

const BOSS_HORNS: Item[] = [
  NONE,
  {
    id: 'devil',
    label: 'เขาปีศาจ',
    draw: (p) => ({ hat: horn((f) => `M${f(46)} 64Q${f(16)} 44 ${f(26)} 4Q${f(54)} 20 ${f(70)} 46Z`, p.c) })
  },
  {
    id: 'ram',
    label: 'เขาแกะ',
    draw: (p) => ({
      hat: [
        ...horn((f) => `M${f(48)} 62Q${f(-2)} 66 ${f(2)} 24Q${f(22)} -2 ${f(48)} 18Q${f(60)} 34 ${f(44)} 44Q${f(34)} 36 ${f(28)} 44Q${f(30)} 54 ${f(52)} 50Z`, p.c),
        ...pair((f) => [L(`M${f(12)} 30Q${f(20)} 22 ${f(30)} 24M${f(10)} 46Q${f(16)} 42 ${f(24)} 44`, 2.5, p.cd)])
      ]
    })
  },
  {
    id: 'crown',
    label: 'มงกุฎ',
    draw: (p) => ({
      hat: [
        P('M44 64V26L64 44L82 10L100 38L118 10L136 44L156 26V64Z', GOLD),
        P(rr(42, 52, 116, 14, 4), GOLD_DEEP, 3.5),
        P(circle(72, 59, 4.5), p.c, 2.5),
        P(circle(100, 59, 4.5), p.c, 2.5),
        P(circle(128, 59, 4.5), p.c, 2.5)
      ]
    })
  },
  {
    id: 'halo',
    label: 'วงแหวน',
    draw: () => ({ hat: [...band(el(100, 18, 44, 10), 5, GOLD)] })
  }
];

const ROBE = 'M58 166Q100 152 142 166L160 282Q100 294 40 282Z';
const bossShoes: Shape[] = [P(el(76, 288, 20, 9), '#2a2b3d'), P(el(124, 288, 20, 9), '#2a2b3d')];

function bossArms(skin: string, sleeve: string, cuff: string): Shape[] {
  const out: Shape[] = [];
  for (const left of [true, false]) {
    const x = left ? 32 : 142;
    const rot: Rot = left ? [16, 58, 180] : [-16, 142, 180];
    out.push({ ...P(circle(x + 13, 236, 12), skin), rot });
    out.push({ ...P(rr(x, 172, 26, 62, 13), sleeve), rot });
    out.push({ ...P(rr(x - 1, 222, 28, 11, 4), cuff, 3), rot });
  }
  return out;
}

const BOSS_ROBES: Item[] = [
  {
    id: 'robe',
    label: 'ชุดคลุมจอมมาร',
    draw: (p) => ({
      torso: [...bossShoes, P(ROBE, p.c), L('M100 200V284', 2.5, p.cd), P('M50 222H150L152 236H48Z', GOLD, 3.5), P(rr(91, 218, 18, 22, 4), GOLD_DEEP, 3)],
      arms: bossArms(p.skin, p.c, GOLD),
      neck: [P('M66 164L100 190L134 164L122 160L100 176L78 160Z', GOLD, 3.5)]
    })
  },
  {
    id: 'armor',
    label: 'ชุดเกราะ',
    draw: (p) => ({
      torso: [
        ...bossShoes,
        P(ROBE, p.cd),
        P('M66 168Q100 158 134 168L130 222Q100 234 70 222Z', p.cl),
        L('M100 172V226M78 196H122', 2.5, p.cd),
        P('M50 228H150L152 242H48Z', '#8a5a33', 3.5),
        P(rr(92, 225, 16, 20, 4), GOLD, 3)
      ],
      arms: [...bossArms(p.skin, p.cd, p.cl), P(el(52, 176, 20, 14), p.cl), P(el(148, 176, 20, 14), p.cl)]
    })
  },
  {
    id: 'suit',
    label: 'ชุดครู',
    draw: (p) => ({
      torso: [
        ...bossShoes,
        P(ROBE, p.c),
        P('M84 162L100 214L116 162Z', WHITE, 3),
        P('M96 172H104L103 180L107 204L100 212L93 204L97 180Z', '#ef4b4b', 3),
        P('M84 162L100 214L76 196L70 168Z', p.cl, 3),
        P('M116 162L100 214L124 196L130 168Z', p.cl, 3),
        F(circle(100, 236, 3), p.cd),
        F(circle(100, 256, 3), p.cd)
      ],
      arms: bossArms(p.skin, p.c, WHITE)
    })
  },
  {
    id: 'wizard',
    label: 'ชุดพ่อมด',
    draw: (p) => ({
      torso: [
        ...bossShoes,
        P(ROBE, p.c),
        F('M42 268Q100 280 158 268L160 282Q100 294 40 282Z', GOLD),
        F(star4(80, 214, 9), GOLD),
        F(star4(122, 240, 7), GOLD),
        F(star4(96, 254, 5), WHITE),
        L(ROBE, 4)
      ],
      arms: bossArms(p.skin, p.c, GOLD),
      neck: [P(rr(64, 160, 72, 14, 7), p.cl, 3.5)]
    })
  }
];

const BOSS_CAPES: Item[] = [
  NONE,
  {
    id: 'cape',
    label: 'ผ้าคลุม',
    draw: (p) => ({ bagBack: [P('M60 168Q8 226 -6 288Q46 300 100 290Q154 300 206 288Q192 226 140 168Z', p.c), L('M30 240Q24 268 28 290M170 240Q176 268 172 290', 2.5, p.cd)] })
  },
  {
    id: 'tatter',
    label: 'ผ้าคลุมขาดวิ่น',
    draw: (p) => ({
      bagBack: [P('M60 168Q8 226 -8 286L10 272L24 296L42 276L60 298L80 280L100 296L120 280L140 298L158 276L176 296L190 272L208 286Q192 226 140 168Z', p.c)]
    })
  },
  {
    id: 'royal',
    label: 'ผ้าคลุมคอตั้ง',
    draw: (p) => ({
      bagBack: [
        P('M60 168Q8 226 -6 288Q46 300 100 290Q154 300 206 288Q192 226 140 168Z', p.c),
        P('M26 168L-2 98Q52 118 100 160Q148 118 202 98L174 168Z', p.cd),
        L('M-6 288Q46 300 100 290Q154 300 206 288', 6, GOLD)
      ]
    })
  }
];

const BOSS_WEAPONS: Item[] = [
  NONE,
  {
    id: 'ruler',
    label: 'ไม้บรรทัด',
    draw: () => ({
      shoes: [
        { ...P(rr(176, 150, 14, 104, 3), '#f4d35e'), rot: [-24, 183, 236] as Rot },
        { ...L('M176 164H183M176 178H183M176 192H183M176 206H183M176 220H183', 2), rot: [-24, 183, 236] as Rot }
      ]
    })
  },
  {
    id: 'staff',
    label: 'คทา',
    draw: () => ({
      shoes: [P(rr(180, 104, 9, 188, 4), '#8a5a33'), P(circle(184.5, 96, 17), '#ff5a7a'), F(circle(179, 90, 5), WHITE, 0.7), P(rr(176, 108, 17, 9, 3), GOLD, 3)]
    })
  },
  {
    id: 'trident',
    label: 'สามง่าม',
    draw: () => ({
      shoes: [
        P(rr(180, 120, 9, 172, 4), '#5b4a8a'),
        P('M184.5 70L192 104H177Z', GOLD),
        P('M160 84L170 112H186V122H164Q158 104 160 84Z', GOLD),
        P('M209 84L199 112H183V122H205Q211 104 209 84Z', GOLD)
      ]
    })
  },
  {
    id: 'book',
    label: 'หนังสือเวท',
    draw: () => ({
      bagFront: [P(rr(152, 214, 46, 36, 5), '#7a3fb0'), F(rr(157, 219, 36, 26, 3), '#f6f0dc'), L('M175 219V245', 2.5), F(star4(166, 232, 6), GOLD)]
    })
  }
];

export interface BossCategory {
  id: BossPart;
  title: string;
  /** Field of BossLook that holds the colour of this part (none for the weapon). */
  colorKey?: 'skin' | 'hairColor' | 'hornsColor' | 'robeColor' | 'capeColor';
  colorTitle?: string;
  colors: string[];
  colorNames: string[];
  items: Item[];
  /** Only for the drawn face and hair: they are hidden while the photo is used. */
  cartoonOnly?: boolean;
}

export const BOSS_CATEGORIES: BossCategory[] = [
  { id: 'face', title: 'หน้า', colorKey: 'skin', colorTitle: 'สีผิว', colors: BOSS_SKINS, colorNames: BOSS_SKIN_NAMES, items: BOSS_FACES, cartoonOnly: true },
  { id: 'hair', title: 'ทรงผม', colorKey: 'hairColor', colorTitle: 'สีผม', colors: HAIR_COLORS, colorNames: HAIR_NAMES, items: BOSS_HAIRS, cartoonOnly: true },
  { id: 'horns', title: 'เขา', colorKey: 'hornsColor', colorTitle: 'สีเขา', colors: CLOTH_COLORS, colorNames: CLOTH_NAMES, items: BOSS_HORNS },
  { id: 'robe', title: 'ชุด', colorKey: 'robeColor', colorTitle: 'สีชุด', colors: CLOTH_COLORS, colorNames: CLOTH_NAMES, items: BOSS_ROBES },
  { id: 'cape', title: 'ผ้าคลุม', colorKey: 'capeColor', colorTitle: 'สีผ้าคลุม', colors: CLOTH_COLORS, colorNames: CLOTH_NAMES, items: BOSS_CAPES },
  { id: 'weapon', title: 'อาวุธ', colors: [], colorNames: [], items: BOSS_WEAPONS }
];

const BOSS_BASE: BossLook = {
  head: 'photo',
  skin: 6,
  face: 'evil',
  faceArt: '',
  hair: 'none',
  hairColor: 0,
  horns: 'devil',
  hornsColor: 1,
  robe: 'robe',
  robeColor: 7,
  cape: 'cape',
  capeColor: 9,
  weapon: 'ruler'
};

export function defaultBossLook(): BossLook {
  return { ...BOSS_BASE };
}

/** Turns saved data into a complete boss look; anything unknown falls back to the default. */
export function normalizeBossLook(raw: unknown): BossLook {
  const src = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const out: BossLook = { ...BOSS_BASE };
  if (src.head === 'photo' || src.head === 'cartoon') out.head = src.head;
  for (const cat of BOSS_CATEGORIES) {
    const v = src[cat.id];
    if (typeof v === 'string' && cat.items.some((i) => i.id === v)) (out[cat.id] as string) = v;
    if (cat.colorKey) {
      const c = src[cat.colorKey];
      if (typeof c === 'number' && Number.isInteger(c) && c >= 0 && c < cat.colors.length) out[cat.colorKey] = c;
    }
  }
  if (typeof src.faceArt === 'string' && decodeFaceArt(src.faceArt).length > 0) out.faceArt = src.faceArt;
  if (out.face === CUSTOM_FACE && !out.faceArt) out.face = BOSS_BASE.face;
  return out;
}

function bossShapes(look: BossLook, withPhoto: boolean): { under: Shape[]; over: Shape[] } {
  const skin = BOSS_SKINS[look.skin] ?? BOSS_SKINS[BOSS_BASE.skin];
  const layers: Parts = {};
  for (const cat of BOSS_CATEGORIES) {
    if (cat.cartoonOnly && withPhoto) continue;
    const item = cat.items.find((i) => i.id === look[cat.id]) ?? cat.items[0];
    const color = cat.colorKey && cat.id !== 'face' ? cat.colors[look[cat.colorKey]] ?? cat.colors[0] : skin;
    const parts = item.draw(paint(color, skin));
    for (const key of Object.keys(parts) as Layer[]) layers[key] = [...(layers[key] ?? []), ...(parts[key] ?? [])];
  }
  if (!withPhoto && look.face === CUSTOM_FACE) layers.face = faceArtShapes(look.faceArt);
  const pickLayers = (keys: Layer[]) => keys.flatMap((k) => layers[k] ?? []);
  return {
    under: pickLayers(['bagBack', 'hairBack', 'shoes', 'torso', 'arms', 'bagFront', 'neck']),
    over: pickLayers(['face', 'hairFront', 'glasses', 'hat'])
  };
}

function paintShapes(ctx: CanvasRenderingContext2D, shapes: Shape[]) {
  for (const s of shapes) {
    const path = new Path2D(s.d);
    ctx.save();
    if (s.o !== undefined) ctx.globalAlpha = s.o;
    if (s.rot) {
      const [deg, cx, cy] = s.rot;
      ctx.translate(cx, cy);
      ctx.rotate((deg * Math.PI) / 180);
      ctx.translate(-cx, -cy);
    }
    if (s.fill) {
      ctx.fillStyle = s.fill;
      ctx.fill(path);
    }
    if (s.stroke) {
      ctx.strokeStyle = s.stroke;
      ctx.lineWidth = s.sw ?? 3;
      ctx.stroke(path);
    }
    ctx.restore();
  }
}

/**
 * The boss painted on a canvas `height` pixels tall. `photo` is the teacher's picture; it is used as
 * the face when the look says so (without a picture the drawn face is shown instead).
 */
export function bossCanvas(look: BossLook, height: number, photo: CanvasImageSource | null = null): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const k = height / BOSS_H;
  canvas.width = Math.round(BOSS_W * k);
  canvas.height = Math.round(height);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  const usePhoto = look.head === 'photo' && photo !== null;
  const { under, over } = bossShapes(look, usePhoto);
  const skin = BOSS_SKINS[look.skin] ?? BOSS_SKINS[BOSS_BASE.skin];
  ctx.scale(k, k);
  ctx.translate(-BOSS_LEFT, 0);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  paintShapes(ctx, under);
  paintShapes(ctx, [F(HEAD, skin)]);
  if (usePhoto && photo) {
    const img = photo as HTMLImageElement;
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const side = Math.min(iw, ih);
    ctx.save();
    ctx.clip(new Path2D(HEAD));
    // the head is 156 x 138: show the middle square of the picture across its width
    ctx.drawImage(img, (iw - side) / 2, (ih - side) / 2, side, side, 22, 25, 156, 156);
    ctx.restore();
  }
  paintShapes(ctx, [L(HEAD, 4)]);
  paintShapes(ctx, over);
  return canvas;
}
